import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ClickEventInsert } from './click-normalizer';

@Injectable()
export class ClicksRepository {
  constructor(private readonly prisma: PrismaService) {}

  // Returns the number of rows actually inserted (duplicates by job_id are skipped).
  async bulkInsert(events: ClickEventInsert[]): Promise<number> {
    if (events.length === 0) {
      return 0;
    }

    const valueRows = events.map(
      (event) =>
        Prisma.sql`(${event.code}, ${event.jobId}, ${event.occurredAt}, ${event.ip}, ${event.country}, ${event.device}, ${event.browser}, ${event.refererHost})`,
    );

    // Explicit casts so all-null text columns don't trip "could not determine data type" in VALUES.
    return this.prisma.$executeRaw`
      INSERT INTO click_events (link_id, job_id, occurred_at, day, ip, country, device, browser, referer_host)
      SELECT l.id,
             v.job_id::text,
             v.occurred_at::timestamptz,
             (v.occurred_at::timestamptz)::date,
             v.ip::inet,
             v.country::text,
             v.device::text,
             v.browser::text,
             v.referer_host::text
      FROM (VALUES ${Prisma.join(valueRows)})
        AS v(code, job_id, occurred_at, ip, country, device, browser, referer_host)
      JOIN links l ON l.code = v.code::text
      ON CONFLICT (job_id) DO NOTHING
    `;
  }
}
