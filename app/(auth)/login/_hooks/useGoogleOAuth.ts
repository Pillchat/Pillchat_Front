import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks";
import { buildGoogleOAuthUrl } from "../_utils/googleOAuth";
import { completeNachocodeOAuthLogin } from "../_utils/completeNachocodeOAuthLogin";
import { isNachocodeApp } from "../_utils/nachocodeNativeOAuth";

export const useGoogleOAuth = (rememberMe: boolean) => {
  const router = useRouter();
  const { saveTokensAndSetupRefresh } = useAuth();
  const [isGoogleLoginLoading, setIsGoogleLoginLoading] = useState(false);
  const [googleLoginError, setGoogleLoginError] = useState<string | null>(null);

  const startGoogleLogin = async () => {
    setGoogleLoginError(null);

    try {
      setIsGoogleLoginLoading(true);

      if (await isNachocodeApp()) {
        const result = await completeNachocodeOAuthLogin({
          provider: "google",
          rememberMe,
          saveTokensAndSetupRefresh,
        });

        router.replace(result === "onboarding" ? "/onboarding/oauth" : "/");
        return;
      }

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
