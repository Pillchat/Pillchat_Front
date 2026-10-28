"use client";
import { useQuery } from "@tanstack/react-query";
import { useAuthIdentity } from "@/hooks/useAuthIdentity";
import { readWeaknessLibrary } from "@/lib/client/weakness";

export function useWeaknessQuery() {
  const userId = useAuthIdentity();
  return useQuery({
    queryKey: ["weakness-library", userId],
    queryFn: readWeaknessLibrary,
    enabled: !!userId,
    staleTime: 0,
    retry: 1,
  });
}
