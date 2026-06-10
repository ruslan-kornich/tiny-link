import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export type RollupRunResult = { processed: number };

const ROLLUP_TRANSACTION_TIMEOUT_MS = 30_000;
const ROLLUP_TRANSACTION_MAX_WAIT_MS = 10_000;

// Postgres 40001 surfaces as P2034 from model queries but as P2010 with
// meta.code='40001' from $queryRaw/$executeRaw.
function isSerializationConflict(error: unknown): boolean {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) {
    return false;
  }
  if (error.code === 'P2034') {
    return true;
  }
  return error.code === 'P2010' && (error.meta as { code?: string } | undefined)?.code === '40001';
}

@Injectable()
export class RollupRepository {
  constructor(private readonly prisma: PrismaService) {}

  // One bounded, idempotent rollup pass. Safe to overlap: the FOR UPDATE lock
  // serializes runs; under RepeatableRead the loser of that lock gets a
  // serialization failure (P2034), which we report as an empty pass.
  async runOnce(batchSize: number): Promise<RollupRunResult> {
    try {
      return await this.prisma.$transaction(
        async (tx) => {
          const cursorRows = await tx.$queryRaw<{ last_event_id: bigint }[]>(
            Prisma.sql`SELECT last_event_id FROM rollup_cursor WHERE id = 1 FOR UPDATE`,
          );
          const cursorRow = cursorRows[0];
          if (cursorRow === undefined) {
            throw new Error('rollup_cursor row id=1 is missing; run migrations');
          }
          const lastEventId = cursorRow.last_event_id;

          const boundedRows = await tx.$queryRaw<{ max_id: bigint | null; batch_count: bigint }[]>(
            Prisma.sql`
              SELECT max(id) AS max_id, count(*) AS batch_count
              FROM (
                SELECT id FROM click_events WHERE id > ${lastEventId} ORDER BY id LIMIT ${batchSize}
              ) AS bounded
            `,
          );
          const maxId = boundedRows[0]?.max_id ?? null;
          if (maxId === null) {
            return { processed: 0 };
          }

          await this.aggregate(tx, lastEventId, maxId);

          await tx.$executeRaw(
            Prisma.sql`UPDATE rollup_cursor SET last_event_id = ${maxId}, updated_at = now() WHERE id = 1`,
          );

          return { processed: Number(boundedRows[0]?.batch_count ?? 0n) };
        },
        {
          timeout: ROLLUP_TRANSACTION_TIMEOUT_MS,
          maxWait: ROLLUP_TRANSACTION_MAX_WAIT_MS,
          // One snapshot for all six statements: under ReadCommitted a click
          // batch committing mid-run would be visible to some upserts but not
          // others, skewing breakdowns the cursor then skips forever.
          isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead,
        },
      );
    } catch (error) {
      if (isSerializationConflict(error)) {
        return { processed: 0 }; // a concurrent run claimed this batch
      }
      throw error;
    }
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
