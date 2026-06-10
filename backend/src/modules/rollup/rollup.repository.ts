import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export type RollupRunResult = { processed: number; advancedTo: bigint };

const ROLLUP_TRANSACTION_TIMEOUT_MS = 30_000;
const ROLLUP_TRANSACTION_MAX_WAIT_MS = 10_000;

@Injectable()
export class RollupRepository {
  constructor(private readonly prisma: PrismaService) {}

  // One bounded, idempotent rollup pass. Safe to overlap: the FOR UPDATE lock serializes runs.
  async runOnce(batchSize: number): Promise<RollupRunResult> {
    return this.prisma.$transaction(
      async (tx) => {
        const cursorRows = await tx.$queryRaw<{ last_event_id: bigint }[]>(
          Prisma.sql`SELECT last_event_id FROM rollup_cursor WHERE id = 1 FOR UPDATE`,
        );
        const cursorRow = cursorRows[0];
        if (cursorRow === undefined) {
          throw new Error('rollup_cursor row id=1 is missing; run migrations');
        }
        const lastEventId = cursorRow.last_event_id;

        const maxRows = await tx.$queryRaw<{ max_id: bigint | null }[]>(Prisma.sql`
          SELECT max(id) AS max_id
          FROM (
            SELECT id FROM click_events WHERE id > ${lastEventId} ORDER BY id LIMIT ${batchSize}
          ) AS bounded
        `);
        const maxId = maxRows[0]?.max_id ?? null;
        if (maxId === null) {
          return { processed: 0, advancedTo: lastEventId };
        }

        await this.aggregate(tx, lastEventId, maxId);

        await tx.$executeRaw(
          Prisma.sql`UPDATE rollup_cursor SET last_event_id = ${maxId}, updated_at = now() WHERE id = 1`,
        );

        const countRows = await tx.$queryRaw<{ processed: bigint }[]>(Prisma.sql`
          SELECT count(*) AS processed FROM click_events WHERE id > ${lastEventId} AND id <= ${maxId}
        `);
        return { processed: Number(countRows[0]?.processed ?? 0n), advancedTo: maxId };
      },
      { timeout: ROLLUP_TRANSACTION_TIMEOUT_MS, maxWait: ROLLUP_TRANSACTION_MAX_WAIT_MS },
    );
  }

  // Five dimensions, each an atomic upsert over the same [last, max] window.
  private async aggregate(tx: Prisma.TransactionClient, lastEventId: bigint, maxId: bigint): Promise<void> {
    const window = Prisma.sql`id > ${lastEventId} AND id <= ${maxId}`;

    await tx.$executeRaw(Prisma.sql`
      INSERT INTO rollup_daily (link_id, day, dimension, dimension_value, clicks, unique_ips)
      SELECT link_id, day, 'total', '', count(*), count(DISTINCT ip)
      FROM click_events WHERE ${window}
      GROUP BY link_id, day
      ON CONFLICT (link_id, day, dimension, dimension_value)
      DO UPDATE SET clicks = rollup_daily.clicks + EXCLUDED.clicks,
                    unique_ips = rollup_daily.unique_ips + EXCLUDED.unique_ips
    `);

    await tx.$executeRaw(Prisma.sql`
      INSERT INTO rollup_daily (link_id, day, dimension, dimension_value, clicks, unique_ips)
      SELECT link_id, day, 'country', country, count(*), count(DISTINCT ip)
      FROM click_events WHERE ${window} AND country IS NOT NULL
      GROUP BY link_id, day, country
      ON CONFLICT (link_id, day, dimension, dimension_value)
      DO UPDATE SET clicks = rollup_daily.clicks + EXCLUDED.clicks,
                    unique_ips = rollup_daily.unique_ips + EXCLUDED.unique_ips
    `);

    await tx.$executeRaw(Prisma.sql`
      INSERT INTO rollup_daily (link_id, day, dimension, dimension_value, clicks, unique_ips)
      SELECT link_id, day, 'device', device, count(*), count(DISTINCT ip)
      FROM click_events WHERE ${window} AND device IS NOT NULL
      GROUP BY link_id, day, device
      ON CONFLICT (link_id, day, dimension, dimension_value)
      DO UPDATE SET clicks = rollup_daily.clicks + EXCLUDED.clicks,
                    unique_ips = rollup_daily.unique_ips + EXCLUDED.unique_ips
    `);

    await tx.$executeRaw(Prisma.sql`
      INSERT INTO rollup_daily (link_id, day, dimension, dimension_value, clicks, unique_ips)
      SELECT link_id, day, 'browser', browser, count(*), count(DISTINCT ip)
      FROM click_events WHERE ${window} AND browser IS NOT NULL
      GROUP BY link_id, day, browser
      ON CONFLICT (link_id, day, dimension, dimension_value)
      DO UPDATE SET clicks = rollup_daily.clicks + EXCLUDED.clicks,
                    unique_ips = rollup_daily.unique_ips + EXCLUDED.unique_ips
    `);

    await tx.$executeRaw(Prisma.sql`
      INSERT INTO rollup_daily (link_id, day, dimension, dimension_value, clicks, unique_ips)
      SELECT link_id, day, 'referer', COALESCE(referer_host, '(direct)'), count(*), count(DISTINCT ip)
      FROM click_events WHERE ${window}
      GROUP BY link_id, day, COALESCE(referer_host, '(direct)')
      ON CONFLICT (link_id, day, dimension, dimension_value)
      DO UPDATE SET clicks = rollup_daily.clicks + EXCLUDED.clicks,
                    unique_ips = rollup_daily.unique_ips + EXCLUDED.unique_ips
    `);
  }

  // Test/recovery helper: reset the cursor to replay from scratch (ADR-0002 replayability).
  async resetCursor(): Promise<void> {
    await this.prisma.$executeRaw`UPDATE rollup_cursor SET last_event_id = 0 WHERE id = 1`;
  }
}
