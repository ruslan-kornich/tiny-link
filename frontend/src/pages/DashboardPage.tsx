import { Link2 } from 'lucide-react';
import { useLinksInfiniteQuery } from '../features/links/useLinksInfiniteQuery';
import { CreateLinkForm } from '../features/links/CreateLinkForm';
import { LinkListItem } from '../features/links/LinkListItem';
import { Spinner } from '../components/ui/Spinner';
import { EmptyState } from '../components/ui/EmptyState';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';

export function DashboardPage() {
  const linksQuery = useLinksInfiniteQuery();
  const links = linksQuery.data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <div className="flex flex-col gap-7">
      <CreateLinkForm />
      <section className="flex flex-col gap-3">
        <div className="flex items-center gap-2.5 px-1">
          <h2 className="font-display text-lg font-bold tracking-tight text-slate-900">Your links</h2>
          {linksQuery.isSuccess && links.length > 0 && (
            <span className="rounded-full bg-brand-100 px-2.5 py-0.5 text-xs font-bold text-brand-700">
              {links.length}
            </span>
          )}
        </div>
        {linksQuery.isPending && (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        )}
        {linksQuery.isError && <Alert tone="error">{linksQuery.error.message}</Alert>}
        {linksQuery.isSuccess && links.length === 0 && (
          <EmptyState
            icon={Link2}
            title="No links yet"
            description="Shorten your first URL using the form above — your links and their stats will live here."
          />
        )}
        {links.map((link, index) => (
          <div
            key={link.code}
            className="animate-rise"
            style={{ animationDelay: `${Math.min(index, 8) * 50}ms` }}
          >
            <LinkListItem link={link} />
          </div>
        ))}
        {linksQuery.hasNextPage && (
          <div className="flex justify-center pt-2">
            <Button
              variant="secondary"
              onClick={() => linksQuery.fetchNextPage()}
              isLoading={linksQuery.isFetchingNextPage}
            >
              Load more
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}
