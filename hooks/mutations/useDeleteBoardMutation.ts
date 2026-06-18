import { fetchAPI } from "@/lib/client/fetch";
import { useMutation } from "@tanstack/react-query";
import type { UseMutationOptions } from "@tanstack/react-query";

export const deleteBoard = (boardId: string) => {
  return fetchAPI(`/api/boards/${boardId}`, "DELETE");
};

export const useDeleteBoardMutation = (
  options?: UseMutationOptions<any, Error, string>,
) => {
  return useMutation({
    mutationFn: deleteBoard,
    ...options,
  });
};
