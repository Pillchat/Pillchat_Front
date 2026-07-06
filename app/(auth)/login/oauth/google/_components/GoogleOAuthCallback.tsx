"use client";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  clearStoredGoogleOAuth,
  getGoogleOAuthRedirectUri,
  getStoredGoogleOAuthRememberMe,
  getStoredGoogleOAuthState,
} from "../../../_utils/googleOAuth";
import {
  clearPendingOAuthSignup,
  getOAuthEmail,
  getOAuthName,
  getOAuthRequiresOnboarding,
  getOAuthSignupToken,
  savePendingOAuthSignup,
} from "../../../_utils/oauthSignup";

type CallbackStatus = "loading" | "error";

const getOAuthErrorMessage = (error: string | null) => {
  if (error === "access_denied") {
    return "Google 로그인이 취소되었습니다.";
  }

  return "Google 로그인에 실패했습니다.";
};

export const GoogleOAuthCallback = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { saveTokensAndSetupRefresh } = useAuth();
  const isHandledRef = useRef(false);
  const [status, setStatus] = useState<CallbackStatus>("loading");
  const [message, setMessage] = useState("Google 로그인 처리 중입니다.");

  useEffect(() => {
    if (isHandledRef.current) return;
    isHandledRef.current = true;

    const completeGoogleLogin = async () => {
      const oauthError = searchParams.get("error");
      if (oauthError) {
        clearStoredGoogleOAuth();
        setStatus("error");
        setMessage(getOAuthErrorMessage(oauthError));
        return;
      }

      const code = searchParams.get("code");
      const returnedState = searchParams.get("state");
      const storedState = getStoredGoogleOAuthState();
      const rememberMe = getStoredGoogleOAuthRememberMe();

      if (!code) {
        clearStoredGoogleOAuth();
        setStatus("error");
        setMessage("Google 인증 코드가 없습니다.");
        return;
      }

      if (!returnedState || !storedState || returnedState !== storedState) {
        clearStoredGoogleOAuth();
        setStatus("error");
        setMessage("Google 로그인 요청을 확인할 수 없습니다.");
        return;
      }

      try {
        const response = await fetch("/api/auth/oauth/google", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            code,
            redirectUri: getGoogleOAuthRedirectUri(),
          }),
        });

        const result = await response.json().catch(() => null);

        if (!response.ok || !result?.success) {
          throw new Error(result?.message || "Google 로그인에 실패했습니다.");
        }

        if (getOAuthRequiresOnboarding(result.data)) {
          const oauthSignupToken = getOAuthSignupToken(result.data);

          if (!oauthSignupToken) {
            throw new Error("Google OAuth 임시 가입 토큰이 없습니다.");
          }

          savePendingOAuthSignup({
            provider: "google",
            oauthSignupToken,
            rememberMe,
            email: getOAuthEmail(result.data),
            name: getOAuthName(result.data),
          });
          clearStoredGoogleOAuth();
          router.replace("/onboarding/oauth");
          return;
        }

        const accessToken =
          result.data?.access_token ??
          result.data?.accessToken ??
          result.data?.access;
        const refreshToken =
          result.data?.refresh_token ??
          result.data?.refreshToken ??
          result.data?.refresh;

        if (!accessToken || !refreshToken) {
          throw new Error("Google 로그인 응답에 토큰 데이터가 없습니다.");
        }

        saveTokensAndSetupRefresh(accessToken, refreshToken, rememberMe);
        clearPendingOAuthSignup();
        clearStoredGoogleOAuth();
        router.replace("/");
      } catch (error: any) {
        clearStoredGoogleOAuth();
        setStatus("error");
        setMessage(error.message || "Google 로그인에 실패했습니다.");
      }
    };

    completeGoogleLogin();
  }, [router, saveTokensAndSetupRefresh, searchParams]);

  return (
    <div className="login-page">
      <div className="flex w-full max-w-sm flex-col items-center gap-6 text-center">
        <div className="flex flex-col gap-2">
          <h1 className="text-xl font-semibold text-foreground">
            {status === "loading" ? "로그인 중" : "로그인 실패"}
          </h1>
          <p className="text-sm font-medium text-muted-foreground">{message}</p>
        </div>

        {status === "error" && (
          <Button className="w-full" onClick={() => router.replace("/login")}>
            로그인으로 돌아가기
          </Button>
        )}
      </div>
    </div>
  );
};
