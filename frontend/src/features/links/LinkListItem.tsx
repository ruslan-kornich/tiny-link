import { Link as RouterLink } from 'react-router';
import { ChartLine, CornerDownRight, Globe } from 'lucide-react';
import type { LinkResponse } from '../../api/types';
import { formatDate } from '../../lib/formatDate';
import { getFaviconUrl } from '../../lib/favicon';
import { CopyButton } from './CopyButton';
import { DeactivateLinkButton } from './DeactivateLinkButton';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

interface LinkListItemProps {
  link: LinkResponse;
}

export function LinkListItem({ link }: LinkListItemProps) {
  const faviconUrl = getFaviconUrl(link.longUrl);

  return (
    <div
      className="group rounded-3xl border border-slate-200/70 bg-white p-4 shadow-card transition-all
        duration-200 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-card-hover"
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <div className="flex min-w-0 flex-1 basis-56 items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 ring-1 ring-slate-200/70">
            {faviconUrl ? (
              <img src={faviconUrl} alt="" className="h-5 w-5 rounded" loading="lazy" />
            ) : (
              <Globe className="h-5 w-5 text-slate-400" />
            )}
          </span>
          <a
            href={link.shortUrl}
            target="_blank"
            rel="noreferrer"
            className="min-w-0 truncate font-mono text-sm font-semibold text-brand-600 hover:underline"
          >
            {link.shortUrl}
          </a>
          <span className="flex shrink-0 items-center gap-1.5">
            <CopyButton value={link.shortUrl} />
            <Badge tone={link.active ? 'green' : 'gray'}>{link.active ? 'Active' : 'Inactive'}</Badge>
          </span>
        </div>
        <div className="ml-auto flex shrink-0 items-center gap-1">
          <RouterLink to={`/links/${link.code}`}>
            <Button variant="ghost" size="sm">
              <ChartLine className="h-4 w-4" />
              Stats
            </Button>
          </RouterLink>
          {link.active && <DeactivateLinkButton code={link.code} shortUrl={link.shortUrl} />}
        </div>
      </div>
      <div className="mt-2 flex items-center justify-between gap-3 text-sm text-slate-500 sm:pl-13">
        <span className="flex min-w-0 items-center gap-1.5">
          <CornerDownRight className="h-3.5 w-3.5 shrink-0 text-slate-300" />
          <span className="truncate">{link.longUrl}</span>
        </span>
        <span className="shrink-0 text-xs text-slate-400">{formatDate(link.createdAt)}</span>
      </div>
    </div>
  );
}
