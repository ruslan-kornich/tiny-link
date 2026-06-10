import { Link as RouterLink } from 'react-router';
import { ChartLine } from 'lucide-react';
import type { LinkResponse } from '../../api/types';
import { formatDate } from '../../lib/formatDate';
import { CopyButton } from './CopyButton';
import { DeactivateLinkButton } from './DeactivateLinkButton';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

interface LinkListItemProps {
  link: LinkResponse;
}

export function LinkListItem({ link }: LinkListItemProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-1.5">
          <a
            href={link.shortUrl}
            target="_blank"
            rel="noreferrer"
            className="truncate font-mono text-sm font-medium text-indigo-600 hover:underline"
          >
            {link.shortUrl}
          </a>
          <CopyButton value={link.shortUrl} />
          <Badge tone={link.active ? 'green' : 'gray'}>{link.active ? 'Active' : 'Inactive'}</Badge>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <RouterLink to={`/links/${link.code}`}>
            <Button variant="ghost" size="sm">
              <ChartLine className="h-4 w-4" />
              Stats
            </Button>
          </RouterLink>
          {link.active && <DeactivateLinkButton code={link.code} shortUrl={link.shortUrl} />}
        </div>
      </div>
      <div className="mt-1.5 flex items-center justify-between gap-3 text-sm text-slate-500">
        <span className="truncate">{link.longUrl}</span>
        <span className="shrink-0">{formatDate(link.createdAt)}</span>
      </div>
    </div>
  );
}
