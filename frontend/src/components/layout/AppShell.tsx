import { Link as RouterLink, Outlet } from 'react-router';
import { Link2, LogOut } from 'lucide-react';
import { Button } from '../ui/Button';
import { useAuth } from '../../features/auth/useAuth';

export function AppShell() {
  const { signOut } = useAuth();

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <RouterLink to="/" className="flex items-center gap-2 text-lg font-semibold text-slate-900">
            <Link2 className="h-5 w-5 text-indigo-600" />
            tiny-link
          </RouterLink>
          <Button variant="ghost" size="sm" onClick={signOut}>
            <LogOut className="h-4 w-4" />
            Log out
          </Button>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
