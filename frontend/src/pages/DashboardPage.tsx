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
    <div className="flex flex-col gap-6">
      <CreateLinkForm />
      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-slate-700">Your links</h2>
        {linksQuery.isPending && (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        )}
        {linksQuery.isError && <Alert tone="error">{linksQuery.error.message}</Alert>}
        {linksQuery.isSuccess && links.length === 0 && (
          <EmptyState
            icon={Link2}
            title="No links yet"
            description="Shorten your first URL using the form above."
          />
        )}
        {links.map((link) => (
          <LinkListItem key={link.code} link={link} />
        ))}
        {linksQuery.hasNextPage && (
          <div className="flex justify-center pt-1">
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
