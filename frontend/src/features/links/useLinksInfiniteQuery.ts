import { useInfiniteQuery } from '@tanstack/react-query';
import { listLinks } from '../../api/apiClient';

const PAGE_SIZE = 20;

export function useLinksInfiniteQuery() {
  return useInfiniteQuery({
    queryKey: ['links'],
    queryFn: ({ pageParam }) => listLinks(PAGE_SIZE, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}
