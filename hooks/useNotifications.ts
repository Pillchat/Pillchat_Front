"use client";
import { useCallback, useState } from "react";
import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { fetchAPI } from "@/lib/client/fetch";
import { useAuthIdentity } from "./useAuthIdentity";
import type { Notification } from "@/types/notification";

type InboxPage = {
  items: Notification[];
  nextCursor: string | null;
  hasNext: boolean;
  unreadCount: number;
  snapshotSequence: string;
};
export const useNotifications = () => {
  const userId = useAuthIdentity();
  const client = useQueryClient();
  const [mutationError, setMutationError] = useState<string | null>(null);
  const key = ["notification-inbox", userId];
  const inbox = useInfiniteQuery<InboxPage>({
    queryKey: key,
    enabled: !!userId,
    initialPageParam: null,
    queryFn: ({ pageParam }) =>
      fetchAPI("/api/notifications", "GET", { size: 20, cursor: pageParam }),
    getNextPageParam: (page) => (page.hasNext ? page.nextCursor : undefined),
  });
  const count = useQuery<{ unreadCount: number; snapshotSequence: string }>({
    queryKey: ["notification-count", userId],
    enabled: !!userId,
    queryFn: () => fetchAPI("/api/notifications/unread-count", "GET"),
    refetchInterval: 30000,
  });
  const invalidate = useCallback(async () => {
    await Promise.all([
      client.invalidateQueries({ queryKey: ["notification-inbox", userId] }),
      client.invalidateQueries({ queryKey: ["notification-count", userId] }),
    ]);
  }, [client, userId]);
  const mutate = async (url: string, method: string, body?: unknown) => {
    setMutationError(null);
    try {
      await fetchAPI(url, method, body);
      await invalidate();
    } catch (error) {
      setMutationError(
        error instanceof Error ? error.message : "알림 변경에 실패했습니다.",
      );
    }
  };
  // Use the visible inbox snapshot, never an invented maximum or a later poll.
  const sequence = inbox.data?.pages[0]?.snapshotSequence;
  return {
    notifications: userId
      ? (inbox.data?.pages.flatMap((page) => page.items) ?? [])
      : [],
    unreadCount: userId
      ? (count.data?.unreadCount ?? inbox.data?.pages[0]?.unreadCount ?? 0)
      : 0,
    addNotification: invalidate,
    markAsRead: (id: string) =>
      mutate(`/api/notifications/${encodeURIComponent(id)}/read`, "PATCH"),
    markAllAsRead: () =>
      sequence &&
      mutate("/api/notifications/read-all", "PATCH", {
        throughSequence: sequence,
      }),
    removeNotification: (id: string) =>
      mutate(`/api/notifications/${encodeURIComponent(id)}`, "DELETE"),
    clearAll: () =>
      sequence &&
      mutate(
        `/api/notifications?throughSequence=${encodeURIComponent(sequence)}`,
        "DELETE",
      ),
    isLoading: inbox.isLoading,
    error: mutationError ?? inbox.error?.message,
    hasNextPage: inbox.hasNextPage,
    isFetchingNextPage: inbox.isFetchingNextPage,
    loadMore: () => inbox.fetchNextPage(),
    reload: invalidate,
  };
};
