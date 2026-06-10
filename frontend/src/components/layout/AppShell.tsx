import { Link as RouterLink, Outlet } from 'react-router';
import { LogOut } from 'lucide-react';
import { Button } from '../ui/Button';
import { BrandLogo } from '../ui/BrandLogo';
import { useAuth } from '../../features/auth/useAuth';

export function AppShell() {
  const { signOut } = useAuth();

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/75 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <RouterLink
            to="/"
            className="rounded-xl transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-400"
          >
            <BrandLogo />
          </RouterLink>
          <Button variant="ghost" size="sm" onClick={signOut}>
            <LogOut className="h-4 w-4" />
            Log out
          </Button>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
