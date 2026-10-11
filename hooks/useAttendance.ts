"use client";

import { useEffect, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSetAtom } from "jotai";
import { gradeAtom } from "@/store/profile";
import { useAuthIdentity } from "@/hooks/useAuthIdentity";
import { checkInAttendance, readAttendance } from "@/lib/client/attendance";

export function useAttendance(enabled = true) {
  const userId = useAuthIdentity();
  const client = useQueryClient();
  const setGrade = useSetAtom(gradeAtom);
  const lock = useRef(false);
  const activeUserId = useRef(userId);
  activeUserId.current = userId;
  const queryKey = ["attendance", userId];
  const summary = useQuery({
    queryKey,
    queryFn: readAttendance,
    enabled: enabled && !!userId,
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchInterval: 60_000,
    retry: 1,
  });
  const checkIn = useMutation({
    mutationFn: (_requestUserId: string) => checkInAttendance(),
    onSuccess: async (data, requestUserId) => {
      const requestKey = ["attendance", requestUserId];
      await client.cancelQueries({ queryKey: requestKey, exact: true });
      client.setQueryData(requestKey, data);
      if (activeUserId.current === requestUserId) setGrade(data.grade);
      void client.invalidateQueries({
        queryKey: ["attendance-calendar", requestUserId],
      });
    },
  });
  useEffect(() => {
    if (summary.data) setGrade(summary.data.grade);
  }, [summary.data, setGrade]);
  const submit = async () => {
    if (lock.current) return;
    if (!userId) throw new Error("로그인이 필요합니다.");
    lock.current = true;
    try {
      return await checkIn.mutateAsync(userId);
    } finally {
      lock.current = false;
    }
  };
  return { ...summary, checkIn: submit, isCheckingIn: checkIn.isPending };
}
