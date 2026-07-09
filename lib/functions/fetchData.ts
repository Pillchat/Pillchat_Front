type AuthStorageMode = "local" | "session";

const AUTH_STORAGE_MODE_KEY = "auth_storage_mode";
const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";

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

  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  window.localStorage.removeItem(REFRESH_TOKEN_KEY);
  window.localStorage.removeItem(AUTH_STORAGE_MODE_KEY);
  window.sessionStorage.removeItem(ACCESS_TOKEN_KEY);
  window.sessionStorage.removeItem(REFRESH_TOKEN_KEY);
  window.sessionStorage.removeItem(AUTH_STORAGE_MODE_KEY);
  document.cookie = "access_token=; path=/; max-age=0; SameSite=Lax";
};

export const refreshTokens = async (): Promise<
  { access_token: string; refresh_token: string } | false
> => {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;
  const rememberMe = getStoredAuthMode() !== "session";

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

export const fetchPost = async (url: string, data: any) => {
  const token = url === "/api/auth/login" ? null : await getValidAccessToken();
  const headers: Record<string, string> = {};

  if (url !== "/api/auth/login" && token) {
    headers["Authorization"] = toBearerHeader(token);
  }

  let response = await fetch(url, {
    method: "POST",
    body: JSON.stringify(data),
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  });

  if (response.status === 401 && url !== "/api/auth/login") {
    const refreshed = await refreshTokens();
    if (refreshed) {
      response = await fetch(url, {
        method: "POST",
        body: JSON.stringify(data),
        headers: {
          "Content-Type": "application/json",
          Authorization: toBearerHeader(refreshed.access_token),
        },
      });
    }
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({
      message: "서버 오류가 발생했습니다.",
    }));
    throw new Error(
      errorData.message || `HTTP error! status: ${response.status}`,
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
    headers["Authorization"] = toBearerHeader(token);
  }

  let requestUrl = url;
  let requestBody: string | undefined = undefined;

  if (method.toUpperCase() === "GET" && data) {
    // GET 요청에서는 data를 쿼리 파라미터로 변환
    const params = new URLSearchParams();
    Object.entries(data).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach((v) => params.append(key, v));
      } else {
        params.append(key, value as string);
      }
    });
    requestUrl = `${url}?${params.toString()}`;
  } else if (data) {
    // GET이 아닌 요청에서는 body에 JSON 데이터 포함
    requestBody = JSON.stringify(data);
    headers["Content-Type"] = "application/json";
  }

  const requestOptions: RequestInit = {
    method,
    body: requestBody,
    headers,
  };

  let response = await fetch(requestUrl, requestOptions);

  if (response.status === 401 && !isAuthRequest) {
    const refreshed = await refreshTokens();
    if (refreshed) {
      response = await fetch(requestUrl, {
        ...requestOptions,
        headers: {
          ...headers,
          Authorization: toBearerHeader(refreshed.access_token),
        },
      });
    }
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({
      message: "서버 오류가 발생했습니다.",
    }));
    throw new Error(
      errorData.message || `HTTP error! status: ${response.status}`,
    );
  }

  const result = await response.json();

  return result;
};
