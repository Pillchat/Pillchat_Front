"use client";

import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  BoardScrapStatus,
  boardScrapStatusQueryKey,
  useBoardScrapStatusQuery,
} from "@/hooks/queries";
import { useToggleBoardScrapMutation } from "@/hooks/mutations";

export const useBoardScrapStatus = (boardId: string) => {
  const queryClient = useQueryClient();
  const queryKey = boardScrapStatusQueryKey(boardId);
  const { data, isLoading } = useBoardScrapStatusQuery(boardId);
  const toggleMutation = useToggleBoardScrapMutation();

  const isScrapped = data?.isScrapped ?? false;
  const scrapCount = data?.scrapCount ?? 0;

  const toggleScrap = useCallback(async (): Promise<boolean> => {
    if (!boardId) return false;

    const previous = queryClient.getQueryData<BoardScrapStatus>(queryKey) ?? {
      isScrapped,
      scrapCount,
    };
    const nextScrapped = !previous.isScrapped;
    const nextStatus = {
      isScrapped: nextScrapped,
      scrapCount: nextScrapped
        ? previous.scrapCount + 1
        : Math.max(0, previous.scrapCount - 1),
    };

    try {
      queryClient.setQueryData(queryKey, nextStatus);
      await toggleMutation.mutateAsync({
        boardId,
        isScrapped: previous.isScrapped,
      });

      return true;
    } catch (error) {
      queryClient.setQueryData(queryKey, previous);
      console.error("게시글 스크랩 요청 실패:", error);
      return false;
    }
  }, [boardId, isScrapped, scrapCount, queryClient, queryKey, toggleMutation]);

  return {
    isScrapped,
    scrapCount,
    isLoading: isLoading || toggleMutation.isPending,
    toggleScrap,
  };
};
