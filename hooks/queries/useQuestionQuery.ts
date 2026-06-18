import { fetchAPI } from "@/lib/client/fetch";
import type { QuestionResponse } from "@/types/question";
import { useQuery } from "@tanstack/react-query";

export const questionQueryKey = (questionId?: string | null) =>
  ["question", questionId] as const;

export const getQuestion = (questionId: string) => {
  return fetchAPI(`/api/questions/${questionId}`, "GET");
};

export const useQuestionQuery = (questionId?: string | null) => {
  return useQuery<QuestionResponse>({
    queryKey: questionQueryKey(questionId),
    queryFn: () => getQuestion(questionId as string),
    enabled: Boolean(questionId),
  });
};
