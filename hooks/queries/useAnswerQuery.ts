import { fetchAPI } from "@/lib/client/fetch";
import { useQuery } from "@tanstack/react-query";

export const answerQueryKey = (answerId?: string | null) =>
  ["answer", answerId] as const;

export const getAnswer = (answerId: string) => {
  return fetchAPI(`/api/answers/${answerId}`, "GET");
};

export const useAnswerQuery = (answerId?: string | null) => {
  return useQuery<any>({
    queryKey: answerQueryKey(answerId),
    queryFn: () => getAnswer(answerId as string),
    enabled: Boolean(answerId),
  });
};
