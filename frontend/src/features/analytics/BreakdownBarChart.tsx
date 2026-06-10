import type { BreakdownEntry } from '../../api/types';
import { Card } from '../../components/ui/Card';

interface BreakdownBarChartProps {
  title: string;
  entries: BreakdownEntry[];
}

const numberFormatter = new Intl.NumberFormat('en-US');

export function BreakdownBarChart({ title, entries }: BreakdownBarChartProps) {
  const maxClicks = Math.max(...entries.map((entry) => entry.clicks), 1);

  return (
    <Card title={title} className="animate-rise">
      {entries.length === 0 ? (
        <p className="py-5 text-center text-sm text-slate-400">No data for this period</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {entries.map((entry) => {
            const label = entry.value && entry.value !== 'null' ? entry.value : 'Unknown';
            return (
              <li key={entry.value}>
                <div className="mb-1.5 flex items-center justify-between gap-2 text-sm">
                  <span className="truncate font-medium text-slate-700">{label}</span>
                  <span className="shrink-0 font-semibold text-slate-900">
                    {numberFormatter.format(entry.clicks)}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-brand-500 to-sky-400 transition-[width] duration-500"
                    style={{ width: `${(entry.clicks / maxClicks) * 100}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
