import type { ReactNode } from 'react';
import { CircleAlert, CircleCheck } from 'lucide-react';

interface AlertProps {
  tone: 'error' | 'success';
  children: ReactNode;
}

const toneClasses = {
  error: 'bg-red-50 text-red-700 ring-red-200',
  success: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
};

export function Alert({ tone, children }: AlertProps) {
  const Icon = tone === 'error' ? CircleAlert : CircleCheck;
  return (
    <div
      className={`flex animate-pop items-start gap-2.5 rounded-2xl px-4 py-3 text-sm font-medium ring-1 ${toneClasses[tone]}`}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
