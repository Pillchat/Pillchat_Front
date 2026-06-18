import { fetchAPI } from "@/lib/client/fetch";
import { useMutation } from "@tanstack/react-query";
import type { UseMutationOptions } from "@tanstack/react-query";

export const deleteAnswer = (answerId: string | number) => {
  return fetchAPI(`/api/answers/${answerId}`, "DELETE");
};

export const useDeleteAnswerMutation = (
  options?: UseMutationOptions<any, Error, string | number>,
) => {
  return useMutation({
    mutationFn: deleteAnswer,
    ...options,
  });
};
