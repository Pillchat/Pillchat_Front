import { fetchAPI } from "@/lib/client/fetch";
import { useQuery } from "@tanstack/react-query";

export const questionsQueryKey = (status?: string | null) =>
  ["questions", status] as const;

export const getQuestions = (status: string) => {
  return fetchAPI(`/api/questions?status=${status}`, "GET");
};

export const useQuestionsQuery = (status: string) => {
  return useQuery({
    queryKey: questionsQueryKey(status),
    queryFn: () => getQuestions(status),
  });
};
