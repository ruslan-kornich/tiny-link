import {
  Area,
  AreaChart,
  CartesianGrid,
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

const tooltipStyle = {
  borderRadius: '1rem',
  border: '1px solid #e2e8f0',
  boxShadow: '0 10px 28px -16px rgb(16 44 110 / 0.25)',
  fontSize: '0.8rem',
  fontFamily: 'inherit',
};

export function DailyClicksChart({ daily }: DailyClicksChartProps) {
  return (
    <Card title="Clicks per day" className="animate-rise">
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={daily} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
            <defs>
              <linearGradient id="clicksFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#4d74ff" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#4d74ff" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="visitorsFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0ea5e9" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#0ea5e9" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis
              dataKey="day"
              tick={{ fontSize: 12, fill: '#64748b' }}
              tickLine={false}
              axisLine={{ stroke: '#e2e8f0' }}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 12, fill: '#64748b' }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip contentStyle={tooltipStyle} />
            <Area
              type="monotone"
              dataKey="clicks"
              name="Clicks"
              stroke="#2c55f5"
              strokeWidth={2.5}
              fill="url(#clicksFill)"
              dot={false}
              activeDot={{ r: 4, strokeWidth: 2, stroke: '#ffffff' }}
            />
            <Area
              type="monotone"
              dataKey="uniqueIps"
              name="Unique visitors"
              stroke="#0ea5e9"
              strokeWidth={2.5}
              fill="url(#visitorsFill)"
              dot={false}
              activeDot={{ r: 4, strokeWidth: 2, stroke: '#ffffff' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
