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
    <Card title={title}>
      {entries.length === 0 ? (
        <p className="py-4 text-center text-sm text-slate-400">No data for this period</p>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {entries.map((entry) => {
            const label = entry.value && entry.value !== 'null' ? entry.value : 'Unknown';
            return (
              <li key={entry.value}>
                <div className="mb-1 flex items-center justify-between gap-2 text-sm">
                  <span className="truncate text-slate-700">{label}</span>
                  <span className="shrink-0 font-medium text-slate-900">
                    {numberFormatter.format(entry.clicks)}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-slate-100">
                  <div
                    className="h-2 rounded-full bg-indigo-500"
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
