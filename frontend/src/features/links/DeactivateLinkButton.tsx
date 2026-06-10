import { useState } from 'react';
import { Ban } from 'lucide-react';
import { useDeactivateLinkMutation } from './useDeactivateLinkMutation';
import { Button } from '../../components/ui/Button';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';

interface DeactivateLinkButtonProps {
  code: string;
  shortUrl: string;
}

export function DeactivateLinkButton({ code, shortUrl }: DeactivateLinkButtonProps) {
  const deactivateMutation = useDeactivateLinkMutation();
  const [dialogOpen, setDialogOpen] = useState(false);

  function handleConfirm() {
    deactivateMutation.mutate(code, {
      onSettled: () => setDialogOpen(false),
    });
  }

  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => setDialogOpen(true)}>
        <Ban className="h-4 w-4 text-red-500" />
        Deactivate
      </Button>
      <ConfirmDialog
        open={dialogOpen}
        title="Deactivate link?"
        description={`Visitors of ${shortUrl} will get a "410 Gone" response. This cannot be undone.`}
        confirmLabel="Deactivate"
        isConfirming={deactivateMutation.isPending}
        onConfirm={handleConfirm}
        onCancel={() => setDialogOpen(false)}
      />
    </>
  );
}
