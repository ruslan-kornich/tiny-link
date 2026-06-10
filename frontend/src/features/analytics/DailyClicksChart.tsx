import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { DailyPoint } from '../../api/types';
import { Card } from '../../components/ui/Card';

interface DailyClicksChartProps {
  daily: DailyPoint[];
}

export function DailyClicksChart({ daily }: DailyClicksChartProps) {
  return (
    <Card title="Clicks per day">
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={daily} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#64748b' }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#64748b' }} />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="clicks"
              name="Clicks"
              stroke="#4f46e5"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="uniqueIps"
              name="Unique visitors"
              stroke="#10b981"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
