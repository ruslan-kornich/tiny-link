import { useState } from 'react';
import { Link as RouterLink, useParams } from 'react-router';
import { ArrowLeft, CalendarDays, CornerDownRight, Globe, SearchX } from 'lucide-react';
import { ApiError } from '../api/apiClient';
import { formatDate, daysAgoRange } from '../lib/formatDate';
import { getFaviconUrl } from '../lib/favicon';
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
  const faviconUrl = getFaviconUrl(link.longUrl);

  return (
    <div className="flex flex-col gap-5">
      <div className="animate-rise">
        <RouterLink
          to="/"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-brand-600"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to dashboard
        </RouterLink>

        <div className="mt-3 rounded-3xl border border-slate-200/70 bg-white p-5 shadow-card">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <div className="flex min-w-0 flex-1 basis-56 items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-50 ring-1 ring-slate-200/70">
                {faviconUrl ? (
                  <img src={faviconUrl} alt="" className="h-5.5 w-5.5 rounded" loading="lazy" />
                ) : (
                  <Globe className="h-5.5 w-5.5 text-slate-400" />
                )}
              </span>
              <a
                href={link.shortUrl}
                target="_blank"
                rel="noreferrer"
                className="min-w-0 truncate font-mono text-lg font-semibold text-brand-600 hover:underline"
              >
                {link.shortUrl}
              </a>
              <span className="flex shrink-0 items-center gap-1.5">
                <CopyButton value={link.shortUrl} />
                <Badge tone={link.active ? 'green' : 'gray'}>
                  {link.active ? 'Active' : 'Inactive'}
                </Badge>
              </span>
            </div>
            {link.active && (
              <span className="ml-auto shrink-0">
                <DeactivateLinkButton code={link.code} shortUrl={link.shortUrl} />
              </span>
            )}
          </div>
          <div className="mt-2.5 flex items-center justify-between gap-3 text-sm text-slate-500 sm:pl-14">
            <span className="flex min-w-0 items-center gap-1.5">
              <CornerDownRight className="h-3.5 w-3.5 shrink-0 text-slate-300" />
              <span className="truncate">{link.longUrl}</span>
            </span>
            <span className="flex shrink-0 items-center gap-1.5 text-xs text-slate-400">
              <CalendarDays className="h-3.5 w-3.5" />
              Created {formatDate(link.createdAt)}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between px-1">
        <h2 className="font-display text-lg font-bold tracking-tight text-slate-900">Analytics</h2>
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
