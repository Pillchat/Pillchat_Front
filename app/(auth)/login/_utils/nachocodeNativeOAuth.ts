import type { OAuthProvider } from "./oauthSignup";

const NACHOCODE_API_KEY = process.env.NEXT_PUBLIC_NACHOCODE_API_KEY || "";

const isBrowser = () => typeof window !== "undefined";

export const isNachocodeApp = async () => {
  if (!isBrowser() || !window.Nachocode) return false;

  if (!NACHOCODE_API_KEY) {
    throw new Error("Nachocode API 키가 설정되지 않았습니다.");
  }

  await window.Nachocode.initAsync(NACHOCODE_API_KEY);

  return window.Nachocode.env.isApp();
};

const getSdkErrorMessage = (result: NachocodeResult, providerLabel: string) =>
  result.message || `${providerLabel} 네이티브 로그인에 실패했습니다.`;

const getGoogleNativeToken = () =>
  new Promise<string>((resolve, reject) => {
    const google = window.Nachocode?.google;

    if (!google) {
      reject(new Error("Nachocode Google 로그인이 지원되지 않습니다."));
      return;
    }

    google.login((result, idToken) => {
      if (result.status !== "success") {
        reject(new Error(getSdkErrorMessage(result, "Google")));
        return;
      }

      if (!idToken) {
        reject(new Error("Google 네이티브 ID 토큰이 없습니다."));
        return;
      }

      resolve(idToken);
    });
  });

const getKakaoNativeToken = () =>
  new Promise<string>((resolve, reject) => {
    const kakao = window.Nachocode?.kakao;

    if (!kakao) {
      reject(new Error("Nachocode 카카오 로그인이 지원되지 않습니다."));
      return;
    }

    kakao.login((result, loginData) => {
      if (result.status !== "success") {
        reject(new Error(getSdkErrorMessage(result, "카카오")));
        return;
      }

      if (!loginData?.accessToken) {
        reject(new Error("카카오 네이티브 access token이 없습니다."));
        return;
      }

      resolve(loginData.accessToken);
    });
  });

export const getNachocodeNativeOAuthToken = (provider: OAuthProvider) => {
  if (provider === "google") return getGoogleNativeToken();
  return getKakaoNativeToken();
};
