import { Injectable } from '@nestjs/common';
import { LinksService } from '../links/links.service';
import { AnalyticsRepository } from './analytics.repository';
import { shapeStats, StatsResponse } from './analytics.shaper';
import { StatsQueryDto } from './dto/stats-query.dto';

const TOP_N = 10;
const DEFAULT_WINDOW_DAYS = 7;
const MS_PER_DAY = 86_400_000;

@Injectable()
export class AnalyticsService {
  constructor(
    private readonly repository: AnalyticsRepository,
    private readonly linksService: LinksService,
  ) {}

  async getStats(ownerId: bigint, code: string, query: StatsQueryDto): Promise<StatsResponse> {
    const linkId = await this.linksService.requireOwnedId(ownerId, code); // 404 if not owned (FR-A4)

    const to = query.to ?? this.today();
    const from = query.from ?? this.shiftDays(to, -(DEFAULT_WINDOW_DAYS - 1));

    const rows = await this.repository.readRollups(linkId, this.toUtcDate(from), this.toUtcDate(to));
    return shapeStats(code, { from, to }, rows, TOP_N);
  }

  private today(): string {
    return new Date().toISOString().slice(0, 10);
  }

  private shiftDays(isoDate: string, deltaDays: number): string {
    const shifted = new Date(this.toUtcDate(isoDate).getTime() + deltaDays * MS_PER_DAY);
    return shifted.toISOString().slice(0, 10);
  }

  private toUtcDate(isoDate: string): Date {
    return new Date(`${isoDate}T00:00:00.000Z`);
  }
}
