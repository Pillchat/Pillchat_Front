"use client";

import { useState, useEffect, useCallback } from "react";
import { fetchAPI } from "@/lib/functions";

type LikeTargetType = "questions" | "answers";

/**
 * 좋아요 상태를 관리하는 커스텀 훅
 * 서버 API와 직접 동기화
 */
export const useLikeStatus = (
  id: string,
  type: LikeTargetType = "questions",
) => {
  const [isLiked, setIsLiked] = useState<boolean>(false);
  const [likeCount, setLikeCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // 서버에서 좋아요 상태 로드
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

  // 좋아요 상태 토글
  const toggleLike = useCallback(async (): Promise<boolean> => {
    if (!id) return false;

    const prevLiked = isLiked;
    const prevCount = likeCount;
    const newLikedStatus = !prevLiked;

    try {
      // 낙관적 업데이트
      setIsLiked(newLikedStatus);
      setLikeCount(newLikedStatus ? prevCount + 1 : prevCount - 1);

      // 서버에 요청
      const method = newLikedStatus ? "POST" : "DELETE";
      await fetchAPI(`/api/${type}/${id}/like`, method);

      return true;
    } catch (error) {
      // 실패 시 롤백
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
