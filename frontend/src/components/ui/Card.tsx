import type { ReactNode } from 'react';

interface CardProps {
  title?: string;
  children: ReactNode;
  className?: string;
}

export function Card({ title, children, className = '' }: CardProps) {
  return (
    <div className={`rounded-3xl border border-slate-200/70 bg-white p-5 shadow-card ${className}`}>
      {title && (
        <h2 className="mb-3 text-xs font-bold tracking-[0.08em] text-slate-400 uppercase">{title}</h2>
      )}
      {children}
    </div>
  );
}
