import { useQuery } from '@tanstack/react-query';
import { getLinkStats } from '../../api/apiClient';

export function useLinkStatsQuery(code: string, from: string, to: string) {
  return useQuery({
    queryKey: ['linkStats', code, from, to],
    queryFn: () => getLinkStats(code, from, to),
  });
}
