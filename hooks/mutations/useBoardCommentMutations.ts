import { fetchAPI } from "@/lib/client/fetch";
import { useMutation } from "@tanstack/react-query";
import type { UseMutationOptions } from "@tanstack/react-query";

type ToggleBoardCommentLikePayload = {
  commentId: number;
  nextLiked: boolean;
};

type CreateBoardCommentPayload = {
  boardId: string;
  content: string;
  isAnonymous?: boolean;
};

type UpdateBoardCommentPayload = {
  commentId: number;
  content: string;
};

export const toggleBoardCommentLike = ({
  commentId,
  nextLiked,
}: ToggleBoardCommentLikePayload) => {
  const method = nextLiked ? "POST" : "DELETE";
  return fetchAPI(`/api/boards/comments/${commentId}/like`, method);
};

export const createBoardComment = ({
  boardId,
  content,
  isAnonymous = false,
}: CreateBoardCommentPayload) => {
  return fetchAPI(`/api/boards/${boardId}/comments`, "POST", {
    content: content.trim(),
    isAnonymous,
  });
};

export const updateBoardComment = ({
  commentId,
  content,
}: UpdateBoardCommentPayload) => {
  return fetchAPI(`/api/boards/comments/${commentId}`, "PUT", {
    content: content.trim(),
  });
};

export const deleteBoardComment = (commentId: number) => {
  return fetchAPI(`/api/boards/comments/${commentId}`, "DELETE");
};

export const useToggleBoardCommentLikeMutation = (
  options?: UseMutationOptions<any, Error, ToggleBoardCommentLikePayload>,
) => {
  return useMutation({
    mutationFn: toggleBoardCommentLike,
    ...options,
  });
};

export const useCreateBoardCommentMutation = (
  options?: UseMutationOptions<any, Error, CreateBoardCommentPayload>,
) => {
  return useMutation({
    mutationFn: createBoardComment,
    ...options,
  });
};

export const useUpdateBoardCommentMutation = (
  options?: UseMutationOptions<any, Error, UpdateBoardCommentPayload>,
) => {
  return useMutation({
    mutationFn: updateBoardComment,
    ...options,
  });
};

export const useDeleteBoardCommentMutation = (
  options?: UseMutationOptions<any, Error, number>,
) => {
  return useMutation({
    mutationFn: deleteBoardComment,
    ...options,
  });
};
