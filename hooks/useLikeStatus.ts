import { useState, useEffect } from "react";
import { fetchAPI } from "@/lib/functions";

/**
 * 좋아요 상태를 관리하는 커스텀 훅
 * localStorage를 fallback으로 사용하고 서버와 동기화
 */
export const useLikeStatus = (questionId: string) => {
  const [isLiked, setIsLiked] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // localStorage 키 생성
  const getStorageKey = (id: string) => `question_like_${id}`;

  // 초기 좋아요 상태 로드
  useEffect(() => {
    const loadLikeStatus = async () => {
      if (!questionId) return;

      try {
        setIsLoading(true);

        // 1. localStorage에서 먼저 읽기 (빠른 UI 업데이트)
        const storageKey = getStorageKey(questionId);
        const cachedStatus = localStorage.getItem(storageKey);
        if (cachedStatus !== null) {
          setIsLiked(JSON.parse(cachedStatus));
        }

        // 2. 서버에서 정확한 상태 확인 (v1 API 활용)
        try {
          const response = await fetchAPI(
            `/api/questions/${questionId}/likeCount`,
            "GET",
          );
          const serverLikedStatus = !!response.liked;

          // 서버 상태로 업데이트
          setIsLiked(serverLikedStatus);
          localStorage.setItem(storageKey, JSON.stringify(serverLikedStatus));
        } catch (error) {
          // 서버 요청 실패 시 localStorage 값 유지
          console.warn(
            "좋아요 상태 서버 동기화 실패, localStorage 값 사용:",
            error,
          );
        }
      } catch (error) {
        console.error("좋아요 상태 로드 실패:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadLikeStatus();
  }, [questionId]);

  // 좋아요 상태 토글
  const toggleLike = async (): Promise<boolean> => {
    if (!questionId) return false;

    const storageKey = getStorageKey(questionId);
    const newLikedStatus = !isLiked;

    try {
      // 1. 즉시 UI 업데이트 (낙관적 업데이트)
      setIsLiked(newLikedStatus);
      localStorage.setItem(storageKey, JSON.stringify(newLikedStatus));

      // 2. 서버에 요청
      const method = newLikedStatus ? "POST" : "DELETE";
      await fetchAPI(`/api/questions/${questionId}/like`, method);

      return true;
    } catch (error) {
      // 실패 시 원래 상태로 롤백
      setIsLiked(isLiked);
      localStorage.setItem(storageKey, JSON.stringify(isLiked));
      console.error("좋아요 요청 실패:", error);
      return false;
    }
  };

  // 좋아요 상태 강제 동기화 (필요시 사용)
  const syncWithServer = async () => {
    if (!questionId) return;

    try {
      const response = await fetchAPI(
        `/api/questions/${questionId}/likeCount`,
        "GET",
      );
      const serverLikedStatus = !!response.liked;

      setIsLiked(serverLikedStatus);
      localStorage.setItem(
        getStorageKey(questionId),
        JSON.stringify(serverLikedStatus),
      );
    } catch (error) {
      console.error("서버 동기화 실패:", error);
    }
  };

  return {
    isLiked,
    isLoading,
    toggleLike,
    syncWithServer,
  };
};
