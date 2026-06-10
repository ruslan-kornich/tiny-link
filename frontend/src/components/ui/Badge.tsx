import type { ReactNode } from 'react';

interface BadgeProps {
  tone: 'green' | 'gray' | 'red';
  children: ReactNode;
}

const toneClasses = {
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  gray: 'bg-slate-100 text-slate-500 ring-slate-200',
  red: 'bg-red-50 text-red-700 ring-red-200',
};

const dotClasses = {
  green: 'bg-emerald-500',
  gray: 'bg-slate-400',
  red: 'bg-red-500',
};

export function Badge({ tone, children }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${toneClasses[tone]}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dotClasses[tone]}`} />
      {children}
    </span>
  );
}
