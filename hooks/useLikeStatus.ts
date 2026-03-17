"use client";

import { useState, useEffect, useCallback } from "react";
import { fetchAPI } from "@/lib/functions";

type LikeTargetType = "questions" | "answers" | "boards";

export const useLikeStatus = (
  id: string,
  type: LikeTargetType = "questions",
) => {
  const [isLiked, setIsLiked] = useState<boolean>(false);
  const [likeCount, setLikeCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadLikeStatus = async () => {
      if (!id) return;

      try {
        setIsLoading(true);
        const response = await fetchAPI(`/api/${type}/${id}/likeCount`, "GET");
        setIsLiked(!!response.liked);
        setLikeCount(response.likes ?? 0);
      } catch (error) {
        console.error("좋아요 상태 로드 실패:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadLikeStatus();
  }, [id, type]);

  const toggleLike = useCallback(async (): Promise<boolean> => {
    if (!id) return false;

    const prevLiked = isLiked;
    const prevCount = likeCount;
    const newLikedStatus = !prevLiked;

    try {
      setIsLiked(newLikedStatus);
      setLikeCount(newLikedStatus ? prevCount + 1 : prevCount - 1);

      const method = newLikedStatus ? "POST" : "DELETE";
      await fetchAPI(`/api/${type}/${id}/like`, method);

      return true;
    } catch (error) {
      setIsLiked(prevLiked);
      setLikeCount(prevCount);
      console.error("좋아요 요청 실패:", error);
      return false;
    }
  }, [id, type, isLiked, likeCount]);

  return {
    isLiked,
    likeCount,
    isLoading,
    toggleLike,
  };
};