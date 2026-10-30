"use client";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useAuthIdentity } from "@/hooks/useAuthIdentity";
import { fetchAPI } from "@/lib/client/fetch";
import type {
  HistoryFilter,
  HistoryPage,
  HistoryDetail,
} from "@/lib/learning/history";
export function useLearningHistory(filter: HistoryFilter = "all", limit = 20) {
  const user = useAuthIdentity();
  return useInfiniteQuery({
    queryKey: ["learning-history", user, filter, limit],
    enabled: !!user,
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }): Promise<HistoryPage> =>
      fetchAPI("/api/learning/history", "GET", {
        filter,
        limit,
        cursor: pageParam,
      }),
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    staleTime: 0,
    retry: 1,
  });
}
export function useLearningHistoryDetail(
  source: string,
  id: string,
  filter: HistoryFilter,
) {
  const user = useAuthIdentity();
  return useQuery<HistoryDetail>({
    queryKey: ["learning-history-detail", user, source, id, filter],
    enabled: !!user,
    queryFn: () =>
      fetchAPI(
        `/api/learning/history/${encodeURIComponent(source)}/${encodeURIComponent(id)}`,
        "GET",
        { filter },
      ),
    staleTime: 0,
    retry: 1,
  });
}
