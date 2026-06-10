import { useState, type FormEvent } from 'react';
import { useCreateLinkMutation } from './useCreateLinkMutation';
import { CopyButton } from './CopyButton';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';

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
    <Card title="Shorten a URL">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3" noValidate>
        <div className="flex items-start gap-2">
          <div className="flex-1">
            <Input
              label="Long URL"
              type="url"
              placeholder="https://example.com/very/long/path"
              value={url}
              error={validationError}
              onChange={(event) => setUrl(event.target.value)}
            />
          </div>
          <Button type="submit" isLoading={createLinkMutation.isPending} className="mt-7">
            Shorten
          </Button>
        </div>
        {createLinkMutation.isError && (
          <Alert tone="error">{createLinkMutation.error.message}</Alert>
        )}
        {createdShortUrl && (
          <Alert tone="success">
            <span className="flex items-center gap-1">
              Short link created:
              <span className="font-mono font-medium">{createdShortUrl}</span>
              <CopyButton value={createdShortUrl} />
            </span>
          </Alert>
        )}
      </form>
    </Card>
  );
}
