import type { ReactNode } from 'react';
import { BrandLogo } from '../../components/ui/BrandLogo';

interface AuthFormLayoutProps {
  heading: string;
  children: ReactNode;
}

export function AuthFormLayout({ heading, children }: AuthFormLayoutProps) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 left-1/2 h-96 w-[42rem] -translate-x-1/2 rounded-full bg-brand-400/20 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-40 -right-20 h-80 w-80 rounded-full bg-sky-300/20 blur-3xl"
      />
      <div className="relative w-full max-w-sm animate-rise">
        <div className="mb-7 flex flex-col items-center gap-3">
          <BrandLogo size="lg" />
          <p className="text-sm font-medium text-slate-500">Shorten. Share. Measure.</p>
        </div>
        <div className="rounded-3xl border border-slate-200/70 bg-white p-6 shadow-card">
          <h1 className="mb-5 font-display text-xl font-bold tracking-tight text-slate-900">
            {heading}
          </h1>
          {children}
        </div>
      </div>
    </div>
  );
}
