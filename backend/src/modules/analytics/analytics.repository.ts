import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export type RollupRow = {
  day: Date;
  dimension: string;
  dimensionValue: string;
  clicks: bigint;
  uniqueIps: bigint;
};

@Injectable()
export class AnalyticsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async readRollups(linkId: bigint, from: Date, to: Date): Promise<RollupRow[]> {
    return this.prisma.rollupDaily.findMany({
      where: { linkId, day: { gte: from, lte: to } },
      select: { day: true, dimension: true, dimensionValue: true, clicks: true, uniqueIps: true },
      orderBy: { day: 'asc' },
    });
  }
}
