import { useState } from "react";
import { buildGoogleOAuthUrl } from "../_utils/googleOAuth";

export const useGoogleOAuth = (rememberMe: boolean) => {
  const [isGoogleLoginLoading, setIsGoogleLoginLoading] = useState(false);
  const [googleLoginError, setGoogleLoginError] = useState<string | null>(null);

  const startGoogleLogin = () => {
    setGoogleLoginError(null);

    try {
      setIsGoogleLoginLoading(true);
      window.location.href = buildGoogleOAuthUrl({ rememberMe });
    } catch (error: any) {
      setIsGoogleLoginLoading(false);
      setGoogleLoginError(
        error.message || "Google 로그인 준비 중 오류가 발생했습니다.",
      );
    }
  };

  return {
    startGoogleLogin,
    isGoogleLoginLoading,
    googleLoginError,
  };
};
