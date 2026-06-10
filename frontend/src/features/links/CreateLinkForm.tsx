import { useState, type FormEvent } from 'react';
import { CircleAlert, Link2, Sparkles, SquareArrowOutUpRight } from 'lucide-react';
import { useCreateLinkMutation } from './useCreateLinkMutation';
import { CopyButton } from './CopyButton';
import { Button } from '../../components/ui/Button';

const MAX_URL_LENGTH = 2048;

function validateUrl(url: string): string | undefined {
  if (!/^https?:\/\//i.test(url)) {
    return 'URL must start with http:// or https://';
  }
  if (url.length > MAX_URL_LENGTH) {
    return `URL must be at most ${MAX_URL_LENGTH} characters`;
  }
  try {
    new URL(url);
  } catch {
    return 'Enter a valid URL';
  }
  return undefined;
}

export function CreateLinkForm() {
  const createLinkMutation = useCreateLinkMutation();
  const [url, setUrl] = useState('');
  const [validationError, setValidationError] = useState<string | undefined>(undefined);
  const [createdShortUrl, setCreatedShortUrl] = useState<string | null>(null);

  const errorMessage =
    validationError ?? (createLinkMutation.isError ? createLinkMutation.error.message : undefined);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const error = validateUrl(url.trim());
    setValidationError(error);
    setCreatedShortUrl(null);
    if (error) {
      return;
    }
    createLinkMutation.mutate(url.trim(), {
      onSuccess: (link) => {
        setUrl('');
        setCreatedShortUrl(link.shortUrl);
      },
    });
  }

  return (
    <section className="relative animate-rise overflow-hidden rounded-3xl bg-gradient-to-br from-brand-950 via-brand-900 to-brand-700 p-6 shadow-card sm:p-8">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 -right-16 h-64 w-64 rounded-full bg-brand-500/30 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-28 -left-10 h-56 w-56 rounded-full bg-sky-400/20 blur-3xl"
      />
      <div className="relative">
        <h1 className="font-display text-2xl font-bold tracking-tight text-white sm:text-[1.7rem]">
          Shorten a long link
        </h1>
        <p className="mt-1 text-sm text-brand-200">
          Paste a URL, get a tiny link, and track every click.
        </p>

        <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-3" noValidate>
          <div className="flex flex-col gap-2.5 sm:flex-row">
            <div className="relative flex-1">
              <Link2 className="pointer-events-none absolute top-1/2 left-4 h-4.5 w-4.5 -translate-y-1/2 text-slate-400" />
              <input
                type="url"
                aria-label="Long URL"
                placeholder="https://example.com/very/long/path"
                value={url}
                onChange={(event) => setUrl(event.target.value)}
                className={`w-full rounded-2xl border-0 bg-white py-3.5 pr-4 pl-11 text-sm text-slate-900
                  placeholder-slate-400 shadow-lg transition-all duration-150 focus:outline-none focus:ring-4
                  ${errorMessage ? 'ring-2 ring-red-400 focus:ring-red-300/60' : 'focus:ring-brand-400/50'}`}
              />
            </div>
            <Button
              type="submit"
              isLoading={createLinkMutation.isPending}
              className="rounded-2xl py-3.5 sm:px-6"
            >
              {!createLinkMutation.isPending && <Sparkles className="h-4 w-4" />}
              Shorten
            </Button>
          </div>

          {errorMessage && (
            <p className="flex animate-pop items-center gap-1.5 text-sm font-medium text-red-300">
              <CircleAlert className="h-4 w-4 shrink-0" />
              {errorMessage}
            </p>
          )}

          {createdShortUrl && (
            <div className="flex animate-pop flex-wrap items-center gap-2 rounded-2xl bg-white/10 px-4 py-3 ring-1 ring-white/20">
              <span className="text-sm text-brand-200">Your tiny link is ready:</span>
              <a
                href={createdShortUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 font-mono text-sm font-semibold text-white hover:underline"
              >
                {createdShortUrl}
                <SquareArrowOutUpRight className="h-3.5 w-3.5 opacity-70" />
              </a>
              <CopyButton value={createdShortUrl} tone="dark" />
            </div>
          )}
        </form>
      </div>
    </section>
  );
}
