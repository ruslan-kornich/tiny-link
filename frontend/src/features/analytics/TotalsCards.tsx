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
      <Card>
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-indigo-50 p-2.5">
            <MousePointerClick className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <p className="text-2xl font-semibold text-slate-900">{numberFormatter.format(clicks)}</p>
            <p className="text-sm text-slate-500">Total clicks</p>
          </div>
        </div>
      </Card>
      <Card>
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-emerald-50 p-2.5">
            <Users className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-2xl font-semibold text-slate-900">{numberFormatter.format(uniqueIps)}</p>
            <p className="text-sm text-slate-500">Unique visitors</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
