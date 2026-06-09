import { AnalyticsService } from '../../src/modules/analytics/analytics.service';
import { AnalyticsRepository } from '../../src/modules/analytics/analytics.repository';
import { LinksService } from '../../src/modules/links/links.service';

describe('AnalyticsService', () => {
  it('passes the explicit inclusive range through to the repository and shaper', async () => {
    const captured: { linkId: bigint | null; from: Date | null; to: Date | null } = {
      linkId: null,
      from: null,
      to: null,
    };
    const repo: Partial<AnalyticsRepository> = {
      readRollups: (linkId, from, to) => {
        captured.linkId = linkId;
        captured.from = from;
        captured.to = to;
        return Promise.resolve([]);
      },
    };
    const links: Partial<LinksService> = { requireOwnedId: () => Promise.resolve(42n) };
    const service = new AnalyticsService(repo as AnalyticsRepository, links as LinksService);

    const result = await service.getStats(7n, 'Ab3xK9', { from: '2026-06-01', to: '2026-06-09' });

    expect(result.range).toEqual({ from: '2026-06-01', to: '2026-06-09' });
    expect(captured.linkId).toBe(42n);
    expect(captured.from?.toISOString()).toBe('2026-06-01T00:00:00.000Z');
    expect(captured.to?.toISOString()).toBe('2026-06-09T00:00:00.000Z');
  });

  it('defaults to a 7-day window ending today when no range is given', async () => {
    const repo: Partial<AnalyticsRepository> = { readRollups: () => Promise.resolve([]) };
    const links: Partial<LinksService> = { requireOwnedId: () => Promise.resolve(1n) };
    const service = new AnalyticsService(repo as AnalyticsRepository, links as LinksService);

    const result = await service.getStats(7n, 'Ab3xK9', {});

    const todayUtc = new Date().toISOString().slice(0, 10);
    const from = new Date(`${result.range.from}T00:00:00.000Z`);
    const to = new Date(`${result.range.to}T00:00:00.000Z`);
    const spanDays = Math.round((to.getTime() - from.getTime()) / 86_400_000);
    expect(spanDays).toBe(6); // inclusive 7-day window
    expect(result.range.to).toBe(todayUtc);
  });
});
