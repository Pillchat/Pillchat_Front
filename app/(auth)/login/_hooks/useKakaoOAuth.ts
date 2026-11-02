import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks";
import { buildKakaoOAuthUrl } from "../_utils/kakaoOAuth";
import { completeNachocodeOAuthLogin } from "../_utils/completeNachocodeOAuthLogin";
import { isNachocodeApp } from "../_utils/nachocodeNativeOAuth";
import { consumeLoginReturnTo } from "@/lib/client/loginReturn";

export const useKakaoOAuth = (rememberMe: boolean) => {
  const router = useRouter();
  const { saveTokensAndSetupRefresh } = useAuth();
  const [isKakaoLoginLoading, setIsKakaoLoginLoading] = useState(false);
  const [kakaoLoginError, setKakaoLoginError] = useState<string | null>(null);

  const startKakaoLogin = async () => {
    setKakaoLoginError(null);

    try {
      setIsKakaoLoginLoading(true);

      if (await isNachocodeApp()) {
        const result = await completeNachocodeOAuthLogin({
          provider: "kakao",
          rememberMe,
          saveTokensAndSetupRefresh,
        });

        router.replace(
          result === "onboarding"
            ? "/onboarding/oauth"
            : consumeLoginReturnTo(),
        );
        return;
      }

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
