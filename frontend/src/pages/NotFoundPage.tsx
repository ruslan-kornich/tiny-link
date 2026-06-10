import { Link as RouterLink } from 'react-router';
import { SearchX } from 'lucide-react';
import { EmptyState } from '../components/ui/EmptyState';
import { Button } from '../components/ui/Button';

export function NotFoundPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-20">
      <EmptyState
        icon={SearchX}
        title="Page not found"
        description="The page you are looking for does not exist."
        action={
          <RouterLink to="/">
            <Button variant="secondary">Go to dashboard</Button>
          </RouterLink>
        }
      />
    </div>
  );
}
