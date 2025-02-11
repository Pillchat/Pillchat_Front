"use client";

import { useEffect, useState } from "react";
import * as S from "../styles/Content";

declare global {
  interface Window {
    Kakao: any;
  }
}

const KakaoShareButton = () => {
  const [currentUrl, setCurrentUrl] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setCurrentUrl(window.location.href); // 현재 페이지 URL 저장
    }

    // ✅ Kakao SDK가 존재하고 초기화되지 않았다면 초기화
    if (window.Kakao && !window.Kakao.isInitialized()) {
      window.Kakao.init(process.env.NEXT_PUBLIC_KAKAO_SHARE_KEY); // 🔹 환경 변수로 변경
      console.log("✅ Kakao SDK initialized");
    }
  }, []);

  const shareKakao = () => {
    if (!window.Kakao) {
      console.error("Kakao SDK가 로드되지 않았습니다.");
      return;
    }

    window.Kakao.Share.sendScrap({
      requestUrl: currentUrl, // 🔹 현재 페이지 URL 공유
    });
  };

  return (
    <S.SVG src="Share.svg" onClick={shareKakao} />
  );
};

export default KakaoShareButton;
