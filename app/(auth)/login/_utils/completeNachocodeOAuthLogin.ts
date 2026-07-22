import type { OAuthProvider } from "./oauthSignup";
import {
  clearPendingOAuthSignup,
  getOAuthEmail,
  getOAuthName,
  getOAuthRequiresOnboarding,
  getOAuthSignupToken,
  savePendingOAuthSignup,
} from "./oauthSignup";
import { getNachocodeNativeOAuthToken } from "./nachocodeNativeOAuth";

type CompleteNachocodeOAuthLoginParams = {
  provider: OAuthProvider;
  rememberMe: boolean;
  saveTokensAndSetupRefresh: (
    accessToken: string,
    refreshToken: string,
    rememberMe?: boolean,
  ) => void;
};

type NativeOAuthResult = "authenticated" | "onboarding";

const providerLabels: Record<OAuthProvider, string> = {
  google: "Google",
  kakao: "카카오",
};

const getAccessToken = (data: any) =>
  data?.access_token ?? data?.accessToken ?? data?.access ?? data?.token;

const getRefreshToken = (data: any) =>
  data?.refresh_token ?? data?.refreshToken ?? data?.refresh;

export const completeNachocodeOAuthLogin = async ({
  provider,
  rememberMe,
  saveTokensAndSetupRefresh,
}: CompleteNachocodeOAuthLoginParams): Promise<NativeOAuthResult> => {
  const providerLabel = providerLabels[provider];
  const token = await getNachocodeNativeOAuthToken(provider);

  const response = await fetch(`/api/auth/oauth/${provider}/native`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ token }),
  });

  const result = await response.json().catch(() => null);

  if (!response.ok || !result?.success) {
    throw new Error(
      result?.message || `${providerLabel} 로그인에 실패했습니다.`,
    );
  }

  if (getOAuthRequiresOnboarding(result.data)) {
    const oauthSignupToken = getOAuthSignupToken(result.data);

    if (!oauthSignupToken) {
      throw new Error(`${providerLabel} OAuth 임시 가입 토큰이 없습니다.`);
    }

    savePendingOAuthSignup({
      provider,
      oauthSignupToken,
      rememberMe,
      email: getOAuthEmail(result.data),
      name: getOAuthName(result.data),
    });

    return "onboarding";
  }

  const accessToken = getAccessToken(result.data);
  const refreshToken = getRefreshToken(result.data);

  if (!accessToken || !refreshToken) {
    throw new Error(`${providerLabel} 로그인 응답에 토큰 데이터가 없습니다.`);
  }

  saveTokensAndSetupRefresh(accessToken, refreshToken, rememberMe);
  clearPendingOAuthSignup();

  return "authenticated";
};
