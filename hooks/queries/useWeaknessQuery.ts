"use client";
import { useQuery } from "@tanstack/react-query";
import { useAuthIdentity } from "@/hooks/useAuthIdentity";
import { readWeaknessLibrary } from "@/lib/client/weakness";

export function useWeaknessQuery(enabled = true) {
  const userId = useAuthIdentity();
  return useQuery({
    queryKey: ["weakness-library", userId],
    queryFn: readWeaknessLibrary,
    enabled: enabled && !!userId,
    staleTime: 0,
    retry: 1,
  });
}
