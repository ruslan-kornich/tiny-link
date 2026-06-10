import { useState } from 'react';
import { Link as RouterLink, useParams } from 'react-router';
import { ArrowLeft, SearchX } from 'lucide-react';
import { ApiError } from '../api/apiClient';
import { formatDate, daysAgoRange } from '../lib/formatDate';
import { useLinkQuery } from '../features/links/useLinkQuery';
import { useLinkStatsQuery } from '../features/analytics/useLinkStatsQuery';
import { CopyButton } from '../features/links/CopyButton';
import { DeactivateLinkButton } from '../features/links/DeactivateLinkButton';
import { RangePresetPicker } from '../features/analytics/RangePresetPicker';
import { TotalsCards } from '../features/analytics/TotalsCards';
import { DailyClicksChart } from '../features/analytics/DailyClicksChart';
import { BreakdownBarChart } from '../features/analytics/BreakdownBarChart';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Spinner } from '../components/ui/Spinner';
import { EmptyState } from '../components/ui/EmptyState';
import { Alert } from '../components/ui/Alert';

export function LinkDetailPage() {
  const { code = '' } = useParams();
  const [rangeDays, setRangeDays] = useState(7);
  const { from, to } = daysAgoRange(rangeDays);
  const linkQuery = useLinkQuery(code);
  const statsQuery = useLinkStatsQuery(code, from, to);

  if (linkQuery.isPending) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }

  if (linkQuery.isError) {
    const isNotFound = linkQuery.error instanceof ApiError && linkQuery.error.statusCode === 404;
    return (
      <EmptyState
        icon={SearchX}
        title={isNotFound ? 'Link not found' : 'Failed to load link'}
        description={isNotFound ? 'This link does not exist or belongs to another account.' : linkQuery.error.message}
        action={
          <RouterLink to="/">
            <Button variant="secondary">Back to dashboard</Button>
          </RouterLink>
        }
      />
    );
  }

  const link = linkQuery.data;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <RouterLink
          to="/"
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to dashboard
        </RouterLink>
        <div className="mt-3 flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-1.5">
            <a
              href={link.shortUrl}
              target="_blank"
              rel="noreferrer"
              className="truncate font-mono text-lg font-semibold text-indigo-600 hover:underline"
            >
              {link.shortUrl}
            </a>
            <CopyButton value={link.shortUrl} />
            <Badge tone={link.active ? 'green' : 'gray'}>{link.active ? 'Active' : 'Inactive'}</Badge>
          </div>
          {link.active && <DeactivateLinkButton code={link.code} shortUrl={link.shortUrl} />}
        </div>
        <div className="mt-1 flex items-center justify-between gap-3 text-sm text-slate-500">
          <span className="truncate">{link.longUrl}</span>
          <span className="shrink-0">Created {formatDate(link.createdAt)}</span>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-700">Analytics</h2>
        <RangePresetPicker selectedDays={rangeDays} onSelect={setRangeDays} />
      </div>

      {statsQuery.isPending && (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      )}
      {statsQuery.isError && <Alert tone="error">{statsQuery.error.message}</Alert>}
      {statsQuery.isSuccess && (
        <>
          <TotalsCards
            clicks={statsQuery.data.totals.clicks}
            uniqueIps={statsQuery.data.totals.uniqueIps}
          />
          <DailyClicksChart daily={statsQuery.data.daily} />
          <div className="grid gap-4 sm:grid-cols-2">
            <BreakdownBarChart title="Countries" entries={statsQuery.data.byCountry} />
            <BreakdownBarChart title="Devices" entries={statsQuery.data.byDevice} />
            <BreakdownBarChart title="Browsers" entries={statsQuery.data.byBrowser} />
            <BreakdownBarChart title="Referrers" entries={statsQuery.data.byReferer} />
          </div>
        </>
      )}
    </div>
  );
}
