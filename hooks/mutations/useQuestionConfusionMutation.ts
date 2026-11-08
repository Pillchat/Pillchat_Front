"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthIdentity } from "@/hooks/useAuthIdentity";
import { fetchAPI } from "@/lib/client/fetch";
import { confusionURL } from "@/hooks/queries/useQuestionConfusionQuery";
import type { ReviewSource } from "@/types/review";

export function useQuestionConfusionMutation(
  source: ReviewSource,
  questionId: string,
) {
  const user = useAuthIdentity();
  const client = useQueryClient();
  return useMutation({
    mutationFn: (request: { confused: boolean; idempotencyKey: string }) =>
      fetchAPI(confusionURL(source, questionId), "PUT", request) as Promise<{
        confused: boolean;
      }>,
    onSuccess: (data) => {
      client.setQueryData(
        ["question-confusion", user, source, questionId],
        data,
      );
      void client.invalidateQueries({ queryKey: ["weakness-library", user] });
      void client.invalidateQueries({ queryKey: ["learning-history", user] });
      void client.invalidateQueries({
        queryKey: ["learning-history-detail", user],
      });
    },
  });
}
