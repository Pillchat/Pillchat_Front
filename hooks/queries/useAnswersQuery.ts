import { fetchAPI } from "@/lib/client/fetch";
import type { AnswerListResponse } from "@/types/question";
import { useQuery } from "@tanstack/react-query";

export const answersQueryKey = (questionId?: string | null, page?: number) =>
  ["answers", questionId, page] as const;

export const getAnswers = (questionId: string, page: number, size: number) => {
  return fetchAPI(
    `/api/answers/cards?questionId=${questionId}&page=${page}&size=${size}`,
    "GET",
  );
};

export const useAnswersQuery = (
  questionId: string,
  page: number,
  size: number,
) => {
  return useQuery<AnswerListResponse>({
    queryKey: answersQueryKey(questionId, page),
    queryFn: () => getAnswers(questionId, page, size),
    enabled: Boolean(questionId),
  });
};
