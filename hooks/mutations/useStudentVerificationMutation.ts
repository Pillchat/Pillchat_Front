"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthIdentity } from "@/hooks/useAuthIdentity";
import {
  reviewStudentVerification,
  StudentVerificationSubmission,
} from "@/lib/client/studentVerification";

export function useSubmitStudentVerificationMutation() {
  const client = useQueryClient();
  const userId = useAuthIdentity();
  return useMutation({
    mutationFn: (submission: StudentVerificationSubmission) =>
      submission.submit(),
    onSuccess: (result) =>
      client.setQueryData(["student-verification", userId], result),
    retry: false,
    onSettled: () =>
      client.invalidateQueries({ queryKey: ["student-verification", userId] }),
  });
}
export function useReviewStudentVerificationMutation() {
  const client = useQueryClient();
  const userId = useAuthIdentity();
  return useMutation({
    mutationFn: ({
      id,
      decision,
    }: {
      id: string;
      decision: "APPROVED" | "REJECTED";
    }) => reviewStudentVerification(id, decision),
    retry: false,
    onSettled: () =>
      client.invalidateQueries({
        queryKey: ["admin-student-verifications", userId],
      }),
  });
}
