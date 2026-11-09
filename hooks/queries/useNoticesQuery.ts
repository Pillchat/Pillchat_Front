"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuthIdentity } from "@/hooks/useAuthIdentity";
import { readNotice, readNotices } from "@/lib/client/notices";
import { fetchAPI } from "@/lib/client/fetch";

export function useNoticesQuery(page = 0, size = 20, enabled = true) {
  const userId = useAuthIdentity();
  return useQuery({
    queryKey: ["notices", userId, page, size],
    queryFn: () => readNotices(page, size),
    enabled: enabled && !!userId,
    staleTime: 0,
    retry: 1,
  });
}

export function useNoticeQuery(id: string) {
  const userId = useAuthIdentity();
  return useQuery({
    queryKey: ["notices", userId, id],
    queryFn: () => readNotice(id),
    enabled: !!userId && !!id,
    retry: 1,
  });
}

export function useAdminNoticeAccessQuery() {
  const userId = useAuthIdentity();
  return useQuery({
    queryKey: ["admin-notices-access", userId],
    queryFn: async () => {
      const data = await fetchAPI("/api/admin/notices", "GET", {
        page: 0,
        size: 1,
      });
      if (!Array.isArray(data?.content))
        throw new Error("관리자 권한을 확인하지 못했어요.");
      return true;
    },
    enabled: !!userId,
    staleTime: 0,
    retry: false,
  });
}
