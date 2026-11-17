"use client";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useAuthIdentity } from "@/hooks/useAuthIdentity";
import {
  readMyStudentVerification,
  readPendingStudentVerifications,
} from "@/lib/client/studentVerification";

export function useMyStudentVerificationQuery() {
  const userId = useAuthIdentity();
  return useQuery({
    queryKey: ["student-verification", userId],
    queryFn: readMyStudentVerification,
    enabled: !!userId,
    gcTime: 0,
    staleTime: 0,
    retry: false,
  });
}
export function usePendingStudentVerificationsQuery() {
  const userId = useAuthIdentity();
  return useInfiniteQuery({
    queryKey: ["admin-student-verifications", userId],
    queryFn: ({ pageParam }) => readPendingStudentVerifications(pageParam),
    initialPageParam: 0,
    getNextPageParam: (last) => (last.hasNext ? last.page + 1 : undefined),
    enabled: !!userId,
    gcTime: 0,
    staleTime: 0,
    retry: false,
  });
}
