import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import * as S from "../styles/Content";
import { useSearchParams } from "next/navigation";

interface LikeButtonProps {
  questionId: string | null;
}

const LikeButton = ({ questionId }: LikeButtonProps) => {
  const [likes, setLikes] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const searchParams = useSearchParams();
  const token = localStorage.getItem("access_token") || "";

  // URL에서 questionId 가져오기 (props보다 우선 적용)
  const urlQuestionId = searchParams.get("questionId");
  const finalQuestionId = urlQuestionId || questionId;

  // 좋아요 개수 가져오는 함수
  const fetchLikeData = useCallback(() => {
    if (!finalQuestionId || !token) return;

    axios
      .get(`${process.env.NEXT_PUBLIC_REACT_APP_BASE_URL}/api/questions/${finalQuestionId}/likeCount`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "ngrok-skip-browser-warning": "69420",
        },
        withCredentials: true,
      })
      .then((res) => {
        setLikes(Number(res.data.likes) || 0); // NaN 방지
        setIsLiked(!!res.data.liked); // undefined 방지
      })
      .catch((err) => console.error("좋아요 데이터 불러오기 실패", err));
  }, [finalQuestionId, token]);

  useEffect(() => {
    fetchLikeData();
  }, [fetchLikeData]);

  const handleLike = async () => {
    if (!finalQuestionId || !token || isLoading) return;
    setIsLoading(true);

    const method = isLiked ? "delete" : "post";

    try {
      await axios({
        method,
        url: `${process.env.NEXT_PUBLIC_REACT_APP_BASE_URL}/api/questions/${finalQuestionId}/like`,
        headers: {
          Authorization: `Bearer ${token}`,
          "ngrok-skip-browser-warning": "69420",
        },
        withCredentials: true,
      });

      fetchLikeData(); // 좋아요 요청 후 최신 데이터 가져오기
    } catch (err) {
      console.error("좋아요 요청 실패", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <S.SoloSVG>
      <S.SVG 
        src={isLiked ? "HeartPlus.svg" : "Heart.svg"} 
        onClick={handleLike} 
      />
      <S.count>{likes}</S.count> {/* 좋아요 개수 표시 */}
    </S.SoloSVG>
  );
};

export default LikeButton;
