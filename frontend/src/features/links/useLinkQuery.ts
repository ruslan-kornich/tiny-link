import { useQuery } from '@tanstack/react-query';
import { getLink } from '../../api/apiClient';

export function useLinkQuery(code: string) {
  return useQuery({
    queryKey: ['link', code],
    queryFn: () => getLink(code),
  });
}
