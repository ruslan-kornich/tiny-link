import type { ReactNode } from 'react';
import { CircleAlert, CircleCheck } from 'lucide-react';

interface AlertProps {
  tone: 'error' | 'success';
  children: ReactNode;
}

const toneClasses = {
  error: 'bg-red-50 text-red-700 border-red-200',
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

export function Alert({ tone, children }: AlertProps) {
  const Icon = tone === 'error' ? CircleAlert : CircleCheck;
  return (
    <div className={`flex items-start gap-2 rounded-xl border px-3.5 py-2.5 text-sm ${toneClasses[tone]}`}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
