"use client";

import { useEffect, useState } from "react";

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

    if (!window.Kakao) return;
    if (!window.Kakao.isInitialized()) {
      window.Kakao.init("NEXT_PUBLIC_KAKAO_SHARE_KEY"); // 🔹 본인의 카카오 키 입력
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
    <button onClick={shareKakao} className="p-2 bg-yellow-400 rounded-lg">
      카카오톡으로 공유하기
    </button>
  );
};

export default KakaoShareButton;
