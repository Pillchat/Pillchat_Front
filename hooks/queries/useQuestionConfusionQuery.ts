"use client";
import { useQuery } from "@tanstack/react-query";
import { useAuthIdentity } from "@/hooks/useAuthIdentity";
import { fetchAPI } from "@/lib/client/fetch";
import type { ReviewSource } from "@/types/review";

export const confusionURL = (source: ReviewSource, questionId: string) =>
  `/api/learning/weakness/questions/${source}/${encodeURIComponent(questionId)}/confusion`;
export function useQuestionConfusionQuery(
  source: ReviewSource,
  questionId: string,
) {
  const user = useAuthIdentity();
  return useQuery<{ confused: boolean }>({
    queryKey: ["question-confusion", user, source, questionId],
    queryFn: () => fetchAPI(confusionURL(source, questionId), "GET"),
    enabled: !!user && !!questionId,
    staleTime: 0,
    retry: 1,
  });
}
