import { shapeStats } from '../../src/modules/analytics/analytics.shaper';
import { RollupRow } from '../../src/modules/analytics/analytics.repository';

function row(partial: Partial<RollupRow>): RollupRow {
  return {
    day: new Date('2026-06-09T00:00:00.000Z'),
    dimension: 'total',
    dimensionValue: '',
    clicks: 0n,
    uniqueIps: 0n,
    ...partial,
  };
}

describe('shapeStats', () => {
  const range = { from: '2026-06-08', to: '2026-06-09' };

  it('sums totals and builds a per-day series', () => {
    const rows: RollupRow[] = [
      row({ day: new Date('2026-06-08T00:00:00.000Z'), clicks: 200n, uniqueIps: 150n }),
      row({ day: new Date('2026-06-09T00:00:00.000Z'), clicks: 134n, uniqueIps: 110n }),
    ];
    const result = shapeStats('Ab3xK9', range, rows, 10);
    expect(result.totals).toEqual({ clicks: 334, uniqueIps: 260 });
    expect(result.daily).toEqual([
      { day: '2026-06-08', clicks: 200, uniqueIps: 150 },
      { day: '2026-06-09', clicks: 134, uniqueIps: 110 },
    ]);
  });

  it('aggregates breakdowns across days, sorts desc, and applies top-N', () => {
    const rows: RollupRow[] = [
      row({ dimension: 'country', dimensionValue: 'US', clicks: 500n }),
      row({ day: new Date('2026-06-08T00:00:00.000Z'), dimension: 'country', dimensionValue: 'US', clicks: 300n }),
      row({ dimension: 'country', dimensionValue: 'DE', clicks: 200n }),
      row({ dimension: 'country', dimensionValue: 'FR', clicks: 50n }),
    ];
    const result = shapeStats('Ab3xK9', range, rows, 2);
    expect(result.byCountry).toEqual([
      { value: 'US', clicks: 800 },
      { value: 'DE', clicks: 200 },
    ]);
  });

  it('returns empty arrays and zero totals when there are no rows', () => {
    const result = shapeStats('Ab3xK9', range, [], 10);
    expect(result.totals).toEqual({ clicks: 0, uniqueIps: 0 });
    expect(result.daily).toEqual([]);
    expect(result.byDevice).toEqual([]);
  });
});
