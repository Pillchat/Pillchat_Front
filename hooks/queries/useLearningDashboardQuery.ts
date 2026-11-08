"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuthIdentity } from "@/hooks/useAuthIdentity";
import { fetchAPI } from "@/lib/client/fetch";
import type { LearningDashboard } from "@/lib/learning/dashboard";

export function useLearningDashboardQuery(enabled: boolean) {
  const userId = useAuthIdentity();
  return useQuery<LearningDashboard>({
    queryKey: ["learning-dashboard", userId],
    queryFn: () => fetchAPI("/api/learning/dashboard", "GET"),
    enabled: enabled && !!userId,
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchInterval: 60_000,
    retry: 1,
  });
}
