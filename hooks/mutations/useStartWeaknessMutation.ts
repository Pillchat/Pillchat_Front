"use client";
import { useMutation } from "@tanstack/react-query";
import { fetchAPI } from "@/lib/client/fetch";
import type { WeaknessStart } from "@/lib/learning/weakness";
import type { reviewAttemptHref } from "@/lib/learning/review";

export function useStartWeaknessMutation() {
  return useMutation({
    mutationFn: (request: WeaknessStart) =>
      fetchAPI("/api/learning/weakness/attempts", "POST", request) as Promise<
        Parameters<typeof reviewAttemptHref>[0]
      >,
  });
}
