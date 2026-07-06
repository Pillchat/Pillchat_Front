import { useState } from "react";
import { buildKakaoOAuthUrl } from "../_utils/kakaoOAuth";

export const useKakaoOAuth = (rememberMe: boolean) => {
  const [isKakaoLoginLoading, setIsKakaoLoginLoading] = useState(false);
  const [kakaoLoginError, setKakaoLoginError] = useState<string | null>(null);

  const startKakaoLogin = () => {
    setKakaoLoginError(null);

    try {
      setIsKakaoLoginLoading(true);
      window.location.href = buildKakaoOAuthUrl({ rememberMe });
    } catch (error: any) {
      setIsKakaoLoginLoading(false);
      setKakaoLoginError(
        error.message || "카카오 로그인 준비 중 오류가 발생했습니다.",
      );
    }
  };

  return {
    startKakaoLogin,
    isKakaoLoginLoading,
    kakaoLoginError,
  };
};
