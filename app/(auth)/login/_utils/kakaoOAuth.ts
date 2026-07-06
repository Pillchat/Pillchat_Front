const KAKAO_OAUTH_STATE_KEY = "kakao_oauth_state";
const KAKAO_OAUTH_REMEMBER_ME_KEY = "kakao_oauth_remember_me";

const KAKAO_AUTHORIZATION_URL = "https://kauth.kakao.com/oauth/authorize";

const isBrowser = () => typeof window !== "undefined";

const createRandomState = () => {
  if (isBrowser() && window.crypto?.getRandomValues) {
    const values = new Uint8Array(16);
    window.crypto.getRandomValues(values);
    return Array.from(values)
      .map((value) => value.toString(16).padStart(2, "0"))
      .join("");
  }

  return Math.random().toString(36).slice(2);
};

export const getKakaoOAuthRedirectUri = () => {
  const configuredRedirectUri = process.env.NEXT_PUBLIC_KAKAO_REDIRECT_URI;
  if (configuredRedirectUri) return configuredRedirectUri;

  if (!isBrowser()) return "";
  return `${window.location.origin}/login/oauth/kakao`;
};

export const buildKakaoOAuthUrl = ({ rememberMe }: { rememberMe: boolean }) => {
  const clientId = process.env.NEXT_PUBLIC_KAKAO_REST_API_KEY;
  const redirectUri = getKakaoOAuthRedirectUri();

  if (!clientId) {
    throw new Error("카카오 REST API 키가 설정되지 않았습니다.");
  }

  if (!redirectUri) {
    throw new Error("카카오 OAuth Redirect URI를 만들 수 없습니다.");
  }

  const state = createRandomState();
  window.sessionStorage.setItem(KAKAO_OAUTH_STATE_KEY, state);
  window.sessionStorage.setItem(
    KAKAO_OAUTH_REMEMBER_ME_KEY,
    String(rememberMe),
  );

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    state,
  });

  return `${KAKAO_AUTHORIZATION_URL}?${params.toString()}`;
};

export const getStoredKakaoOAuthState = () => {
  if (!isBrowser()) return null;
  return window.sessionStorage.getItem(KAKAO_OAUTH_STATE_KEY);
};

export const getStoredKakaoOAuthRememberMe = () => {
  if (!isBrowser()) return false;
  return window.sessionStorage.getItem(KAKAO_OAUTH_REMEMBER_ME_KEY) === "true";
};

export const clearStoredKakaoOAuth = () => {
  if (!isBrowser()) return;
  window.sessionStorage.removeItem(KAKAO_OAUTH_STATE_KEY);
  window.sessionStorage.removeItem(KAKAO_OAUTH_REMEMBER_ME_KEY);
};
