import { fetchAPI } from "@/lib/client/fetch";
import { useMutation } from "@tanstack/react-query";
import type { UseMutationOptions } from "@tanstack/react-query";

export const deleteQuestion = (questionId: string) => {
  return fetchAPI(`/api/questions/${questionId}`, "DELETE");
};

export const useDeleteQuestionMutation = (
  options?: UseMutationOptions<any, Error, string>,
) => {
  return useMutation({
    mutationFn: deleteQuestion,
    ...options,
  });
};
