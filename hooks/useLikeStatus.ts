"use client";

import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  LikeStatus,
  LikeTargetType,
  likeStatusQueryKey,
  useLikeStatusQuery,
} from "@/hooks/queries";
import { useToggleLikeMutation } from "@/hooks/mutations";

export const useLikeStatus = (
  id: string,
  type: LikeTargetType = "questions",
) => {
  const queryClient = useQueryClient();
  const queryKey = likeStatusQueryKey(type, id);
  const { data, isLoading } = useLikeStatusQuery(id, type);
  const toggleMutation = useToggleLikeMutation();

  const isLiked = data?.isLiked ?? false;
  const likeCount = data?.likeCount ?? 0;

  const toggleLike = useCallback(async (): Promise<boolean> => {
    if (!id) return false;

    const previous = queryClient.getQueryData<LikeStatus>(queryKey) ?? {
      isLiked,
      likeCount,
    };
    const nextLiked = !previous.isLiked;
    const nextStatus = {
      isLiked: nextLiked,
      likeCount: nextLiked
        ? previous.likeCount + 1
        : Math.max(0, previous.likeCount - 1),
    };

    try {
      queryClient.setQueryData(queryKey, nextStatus);
      await toggleMutation.mutateAsync({
        id,
        type,
        isLiked: previous.isLiked,
      });

      return true;
    } catch (error) {
      queryClient.setQueryData(queryKey, previous);
      console.error("좋아요 요청 실패:", error);
      return false;
    }
  }, [id, type, isLiked, likeCount, queryClient, queryKey, toggleMutation]);

  return {
    isLiked,
    likeCount,
    isLoading: isLoading || toggleMutation.isPending,
    toggleLike,
  };
};
