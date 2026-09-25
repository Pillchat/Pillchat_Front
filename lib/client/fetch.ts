type AuthStorageMode = "local" | "session";
type TokenPair = { access_token: string; refresh_token: string };

const AUTH_STORAGE_MODE_KEY = "auth_storage_mode";
const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";

let refreshPromise: Promise<TokenPair | false> | null = null;
let authSessionRevision = 0;

const isBrowser = () => typeof window !== "undefined";

const normalizeToken = (token: string) => token.replace(/^(Bearer\s+)+/i, "");
const toBearerHeader = (token: string) => `Bearer ${normalizeToken(token)}`;

const getTokenExpiryTime = (token: string): number | null => {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;

    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
    const parsed = JSON.parse(atob(padded));

    return typeof parsed.exp === "number" ? parsed.exp * 1000 : null;
  } catch {
    return null;
  }
};

const isStoredTokenExpired = (token: string) => {
  const expiresAt = getTokenExpiryTime(token);
  if (!expiresAt) return true;

  return Date.now() >= expiresAt;
};

const getStorage = (mode: AuthStorageMode): Storage | null => {
  if (!isBrowser()) return null;
  return mode === "local" ? window.localStorage : window.sessionStorage;
};

const getStoredAuthMode = (): AuthStorageMode | null => {
  if (!isBrowser()) return null;

  const sessionMode = window.sessionStorage.getItem(AUTH_STORAGE_MODE_KEY);
  if (sessionMode === "session") return "session";

  const localMode = window.localStorage.getItem(AUTH_STORAGE_MODE_KEY);
  if (localMode === "local") return "local";

  return null;
};

const getStoredToken = (key: string) => {
  if (!isBrowser()) return null;

  const mode = getStoredAuthMode();
  if (mode) {
    const token = getStorage(mode)?.getItem(key);
    if (token) return normalizeToken(token);
  }

  const token =
    window.sessionStorage.getItem(key) ?? window.localStorage.getItem(key);
  return token ? normalizeToken(token) : null;
};

const setAccessTokenCookie = (accessToken: string, rememberMe: boolean) => {
  if (!isBrowser()) return;

  const normalizedAccessToken = normalizeToken(accessToken);
  const expiresAt = getTokenExpiryTime(normalizedAccessToken);
  const maxAgeSeconds = expiresAt
    ? Math.max(0, Math.floor((expiresAt - Date.now()) / 1000))
    : 24 * 3600;
  const maxAge = rememberMe ? `; max-age=${maxAgeSeconds}` : "";
  document.cookie = `access_token=${normalizedAccessToken}; path=/${maxAge}; SameSite=Lax`;
};

export const getToken = () => getStoredToken(ACCESS_TOKEN_KEY);

export const getRefreshToken = () => getStoredToken(REFRESH_TOKEN_KEY);

export const getValidAccessToken = async () => {
  const token = getToken();
  if (token && !isStoredTokenExpired(token)) return token;

  if (getRefreshToken()) {
    const refreshed = await refreshTokens();
    if (refreshed) return refreshed.access_token;
  }

  return null;
};

export const setTokens = (
  accessToken: string,
  refreshToken: string,
  rememberMe = true,
) => {
  if (!isBrowser()) return;

  authSessionRevision += 1;

  const normalizedAccessToken = normalizeToken(accessToken);
  const normalizedRefreshToken = normalizeToken(refreshToken);
  const mode: AuthStorageMode = rememberMe ? "local" : "session";
  const targetStorage = getStorage(mode);
  const otherStorage = getStorage(rememberMe ? "session" : "local");

  otherStorage?.removeItem(ACCESS_TOKEN_KEY);
  otherStorage?.removeItem(REFRESH_TOKEN_KEY);
  otherStorage?.removeItem(AUTH_STORAGE_MODE_KEY);

  targetStorage?.setItem(ACCESS_TOKEN_KEY, normalizedAccessToken);
  targetStorage?.setItem(REFRESH_TOKEN_KEY, normalizedRefreshToken);
  targetStorage?.setItem(AUTH_STORAGE_MODE_KEY, mode);

  setAccessTokenCookie(normalizedAccessToken, rememberMe);
};

export const clearTokens = () => {
  if (!isBrowser()) return;

  authSessionRevision += 1;

  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  window.localStorage.removeItem(REFRESH_TOKEN_KEY);
  window.localStorage.removeItem(AUTH_STORAGE_MODE_KEY);
  window.sessionStorage.removeItem(ACCESS_TOKEN_KEY);
  window.sessionStorage.removeItem(REFRESH_TOKEN_KEY);
  window.sessionStorage.removeItem(AUTH_STORAGE_MODE_KEY);
  document.cookie = "access_token=; path=/; max-age=0; SameSite=Lax";
};

const requestTokenRefresh = async (): Promise<TokenPair | false> => {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;
  const rememberMe = getStoredAuthMode() !== "session";
  const requestSessionRevision = authSessionRevision;

  try {
    const response = await fetch("/api/auth/refresh-token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (response.ok) {
      const result = await response.json();
      if (result.success && result.data) {
        const accessToken =
          result.data.access_token ??
          result.data.accessToken ??
          result.data.access;
        const nextRefreshToken =
          result.data.refresh_token ??
          result.data.refreshToken ??
          result.data.refresh ??
          refreshToken;

        if (accessToken) {
          if (requestSessionRevision !== authSessionRevision) {
            return false;
          }

          const normalizedAccessToken = normalizeToken(accessToken);
          const normalizedRefreshToken = normalizeToken(nextRefreshToken);
          setTokens(normalizedAccessToken, normalizedRefreshToken, rememberMe);
          return {
            access_token: normalizedAccessToken,
            refresh_token: normalizedRefreshToken,
          };
        }
      }
    }
  } catch (error) {
    console.error("토큰 갱신 실패:", error);
  }

  clearTokens();
  return false;
};

export const refreshTokens = (): Promise<TokenPair | false> => {
  if (!refreshPromise) {
    refreshPromise = requestTokenRefresh().finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
};

export const recoverAccessToken = async (failedToken?: string | null) => {
  const normalizedFailedToken = failedToken
    ? normalizeToken(failedToken)
    : null;
  const currentToken = getToken();

  if (
    currentToken &&
    currentToken !== normalizedFailedToken &&
    !isStoredTokenExpired(currentToken)
  ) {
    return currentToken;
  }

  const refreshed = await refreshTokens();
  return refreshed ? refreshed.access_token : null;
};

export const fetchPost = async (url: string, data: any) => {
  const token = url === "/api/auth/login" ? null : await getValidAccessToken();
  const headers: Record<string, string> = {};

  if (url !== "/api/auth/login" && token) {
    headers.Authorization = toBearerHeader(token);
  }

  let response = await fetch(url, {
    method: "POST",
    body: JSON.stringify(data),
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  });

  if (
    (response.status === 401 || response.status === 403) &&
    url !== "/api/auth/login"
  ) {
    const recoveredToken = await recoverAccessToken(token);
    if (recoveredToken) {
      response = await fetch(url, {
        method: "POST",
        body: JSON.stringify(data),
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
          Authorization: toBearerHeader(recoveredToken),
        },
      });
    }
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({
      message: "서버 오류가 발생했습니다.",
    }));
    throw new Error(
      errorData.message ||
        errorData.error ||
        errorData.code ||
        `HTTP error! status: ${response.status}`,
    );
  }

  return response;
};

export const fetchAPI = async (url: string, method: string, data?: any) => {
  const isAuthRequest =
    url === "/api/auth/login" || url === "/api/auth/refresh-token";
  const token = isAuthRequest ? null : await getValidAccessToken();
  const headers: Record<string, string> = {};

  if (token) {
    headers.Authorization = toBearerHeader(token);
  }

  let requestUrl = url;
  let requestBody: string | undefined = undefined;

  if (method.toUpperCase() === "GET" && data) {
    const params = new URLSearchParams();
    Object.entries(data).forEach(([key, value]) => {
      if (value === undefined || value === null) return;

      if (Array.isArray(value)) {
        value.forEach((v) => {
          if (v !== undefined && v !== null) params.append(key, String(v));
        });
      } else {
        params.append(key, String(value));
      }
    });
    requestUrl = `${url}?${params.toString()}`;
  } else if (data) {
    requestBody = JSON.stringify(data);
    headers["Content-Type"] = "application/json";
  }

  const requestOptions: RequestInit = {
    method,
    body: requestBody,
    headers,
    credentials: "same-origin",
  };

  let response = await fetch(requestUrl, requestOptions);

  if ((response.status === 401 || response.status === 403) && !isAuthRequest) {
    const recoveredToken = await recoverAccessToken(token);
    if (recoveredToken) {
      response = await fetch(requestUrl, {
        ...requestOptions,
        headers: {
          ...headers,
          Authorization: toBearerHeader(recoveredToken),
        },
      });
    }
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({
      message: "서버 오류가 발생했습니다.",
    }));
    throw new Error(
      errorData.message ||
        errorData.error ||
        errorData.code ||
        `HTTP error! status: ${response.status}`,
    );
  }

  if (response.status === 204) return null;

  const responseText = await response.text();
  if (!responseText.trim()) return null;

  try {
    return JSON.parse(responseText);
  } catch {
    return responseText;
  }
};
