import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createLink } from '../../api/apiClient';

export function useCreateLinkMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (url: string) => createLink(url),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['links'] });
    },
  });
}
