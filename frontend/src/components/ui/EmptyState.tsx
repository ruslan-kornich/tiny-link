import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex animate-rise flex-col items-center gap-3 rounded-3xl border-2 border-dashed border-brand-200/70 bg-white/60 px-6 py-14 text-center">
      {Icon && (
        <div className="rounded-2xl bg-brand-50 p-3.5 text-brand-500 ring-1 ring-brand-100">
          <Icon className="h-7 w-7" />
        </div>
      )}
      <p className="font-display text-base font-bold text-slate-800">{title}</p>
      {description && <p className="max-w-sm text-sm text-slate-500">{description}</p>}
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}
