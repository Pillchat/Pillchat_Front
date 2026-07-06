const GOOGLE_OAUTH_STATE_KEY = "google_oauth_state";
const GOOGLE_OAUTH_REMEMBER_ME_KEY = "google_oauth_remember_me";

const GOOGLE_AUTHORIZATION_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_OAUTH_SCOPE = "openid email profile";

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

export const getGoogleOAuthRedirectUri = () => {
  const configuredRedirectUri = process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI;
  if (configuredRedirectUri) return configuredRedirectUri;

  if (!isBrowser()) return "";
  return `${window.location.origin}/login/oauth/google`;
};

export const buildGoogleOAuthUrl = ({
  rememberMe,
}: {
  rememberMe: boolean;
}) => {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const redirectUri = getGoogleOAuthRedirectUri();

  if (!clientId) {
    throw new Error("Google Client ID가 설정되지 않았습니다.");
  }

  if (!redirectUri) {
    throw new Error("Google OAuth Redirect URI를 만들 수 없습니다.");
  }

  const state = createRandomState();
  window.sessionStorage.setItem(GOOGLE_OAUTH_STATE_KEY, state);
  window.sessionStorage.setItem(
    GOOGLE_OAUTH_REMEMBER_ME_KEY,
    String(rememberMe),
  );

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: GOOGLE_OAUTH_SCOPE,
    state,
    include_granted_scopes: "true",
    prompt: "select_account",
  });

  return `${GOOGLE_AUTHORIZATION_URL}?${params.toString()}`;
};

export const getStoredGoogleOAuthState = () => {
  if (!isBrowser()) return null;
  return window.sessionStorage.getItem(GOOGLE_OAUTH_STATE_KEY);
};

export const getStoredGoogleOAuthRememberMe = () => {
  if (!isBrowser()) return false;
  return window.sessionStorage.getItem(GOOGLE_OAUTH_REMEMBER_ME_KEY) === "true";
};

export const clearStoredGoogleOAuth = () => {
  if (!isBrowser()) return;
  window.sessionStorage.removeItem(GOOGLE_OAUTH_STATE_KEY);
  window.sessionStorage.removeItem(GOOGLE_OAUTH_REMEMBER_ME_KEY);
};
