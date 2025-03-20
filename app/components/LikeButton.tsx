import { useState, useEffect } from "react";
import axios from "axios";
import * as S from "../styles/Content";
import { useSearchParams } from "next/navigation";

interface LikeButtonProps {
  questionId: string | null;
}

const LikeButton = ({ questionId }: LikeButtonProps) => {
  const [likes, setLikes] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const searchParams = useSearchParams();
  const token = localStorage.getItem("access_token") || "";

  // URL에서 questionId 가져오기
  questionId = searchParams.get("questionId");

  useEffect(() => {
    if (!questionId || !token) return; // questionId나 token이 없으면 요청하지 않음

    axios
      .get(`${process.env.NEXT_PUBLIC_REACT_APP_BASE_URL}/api/questions/${questionId}/like`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((res) => {
        setLikes(res.data.likes);
        setIsLiked(res.data.isLiked); // 서버에서 isLiked 값도 받아와 설정
      })
      .catch((err) => console.error("좋아요 데이터 불러오기 실패", err));
  }, [questionId, token]);

  const handleLike = () => {
    if (!questionId || !token) return;

    const method = isLiked ? "delete" : "post";

    axios({
      method,
      url: `${process.env.NEXT_PUBLIC_REACT_APP_BASE_URL}/api/questions/${questionId}/like`,
      headers: {
        Authorization: `Bearer ${token}`,
        "ngrok-skip-browser-warning": "69420",
      },
    })
      .then((res) => {
        setLikes(res.data.likes); // 좋아요 수 갱신
        setIsLiked(!isLiked);
      })
      .catch((err) => console.error("좋아요 요청 실패", err));
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
