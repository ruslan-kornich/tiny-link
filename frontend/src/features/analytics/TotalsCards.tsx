import { MousePointerClick, Users } from 'lucide-react';
import { Card } from '../../components/ui/Card';

interface TotalsCardsProps {
  clicks: number;
  uniqueIps: number;
}

const numberFormatter = new Intl.NumberFormat('en-US');

export function TotalsCards({ clicks, uniqueIps }: TotalsCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <Card className="animate-rise">
        <div className="flex items-center gap-3.5">
          <div className="rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 p-3 text-white shadow-button">
            <MousePointerClick className="h-5 w-5" />
          </div>
          <div>
            <p className="font-display text-[1.7rem] leading-tight font-bold text-slate-900">
              {numberFormatter.format(clicks)}
            </p>
            <p className="text-sm font-medium text-slate-500">Total clicks</p>
          </div>
        </div>
      </Card>
      <Card className="animate-rise">
        <div className="flex items-center gap-3.5">
          <div className="rounded-2xl bg-gradient-to-br from-sky-400 to-sky-600 p-3 text-white shadow-sm">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <p className="font-display text-[1.7rem] leading-tight font-bold text-slate-900">
              {numberFormatter.format(uniqueIps)}
            </p>
            <p className="text-sm font-medium text-slate-500">Unique visitors</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
