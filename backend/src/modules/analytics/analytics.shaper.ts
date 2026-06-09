import { RollupRow } from './analytics.repository';

export type DateRange = { from: string; to: string };
export type BreakdownEntry = { value: string; clicks: number };
export type DailyEntry = { day: string; clicks: number; uniqueIps: number };

export type StatsResponse = {
  code: string;
  range: DateRange;
  totals: { clicks: number; uniqueIps: number };
  daily: DailyEntry[];
  byCountry: BreakdownEntry[];
  byDevice: BreakdownEntry[];
  byBrowser: BreakdownEntry[];
  byReferer: BreakdownEntry[];
};

export function shapeStats(code: string, range: DateRange, rows: RollupRow[], topN: number): StatsResponse {
  const totalRows = rows.filter((row) => row.dimension === 'total');

  const totals = totalRows.reduce(
    (accumulator, row) => ({
      clicks: accumulator.clicks + Number(row.clicks),
      uniqueIps: accumulator.uniqueIps + Number(row.uniqueIps),
    }),
    { clicks: 0, uniqueIps: 0 },
  );

  const daily: DailyEntry[] = totalRows
    .map((row) => ({ day: formatDay(row.day), clicks: Number(row.clicks), uniqueIps: Number(row.uniqueIps) }))
    .sort((left, right) => left.day.localeCompare(right.day));

  return {
    code,
    range,
    totals,
    daily,
    byCountry: breakdown(rows, 'country', topN),
    byDevice: breakdown(rows, 'device', topN),
    byBrowser: breakdown(rows, 'browser', topN),
    byReferer: breakdown(rows, 'referer', topN),
  };
}

function breakdown(rows: RollupRow[], dimension: string, topN: number): BreakdownEntry[] {
  const totalsByValue = new Map<string, number>();
  for (const row of rows) {
    if (row.dimension !== dimension) {
      continue;
    }
    totalsByValue.set(row.dimensionValue, (totalsByValue.get(row.dimensionValue) ?? 0) + Number(row.clicks));
  }
  return Array.from(totalsByValue, ([value, clicks]) => ({ value, clicks }))
    .sort((left, right) => right.clicks - left.clicks)
    .slice(0, topN);
}

function formatDay(day: Date): string {
  return day.toISOString().slice(0, 10);
}
