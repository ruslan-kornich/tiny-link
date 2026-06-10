import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deactivateLink } from '../../api/apiClient';

export function useDeactivateLinkMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (code: string) => deactivateLink(code),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['links'] });
      queryClient.invalidateQueries({ queryKey: ['link', result.code] });
    },
  });
}
