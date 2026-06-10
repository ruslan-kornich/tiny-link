import type { ReactNode } from 'react';
import { Link2 } from 'lucide-react';
import { Card } from '../../components/ui/Card';

interface AuthFormLayoutProps {
  heading: string;
  children: ReactNode;
}

export function AuthFormLayout({ heading, children }: AuthFormLayoutProps) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center justify-center gap-2 text-xl font-semibold text-slate-900">
          <Link2 className="h-6 w-6 text-indigo-600" />
          tiny-link
        </div>
        <Card>
          <h1 className="mb-4 text-base font-semibold text-slate-900">{heading}</h1>
          {children}
        </Card>
      </div>
    </div>
  );
}
