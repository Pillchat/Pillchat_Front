export type OAuthProvider = "google" | "kakao";

export type PendingOAuthSignup = {
  provider: OAuthProvider;
  oauthSignupToken: string;
  rememberMe: boolean;
  email?: string;
  name?: string;
};

const OAUTH_SIGNUP_SESSION_KEY = "oauth_signup_session";

const isBrowser = () => typeof window !== "undefined";

const getFromSources = (data: any, keys: string[]) => {
  for (const source of [data, data?.data]) {
    for (const key of keys) {
      const value = source?.[key];
      if (value !== undefined && value !== null && value !== "") return value;
    }
  }

  return undefined;
};

const getBoolean = (data: any, keys: string[]) => {
  const value = getFromSources(data, keys);

  if (typeof value === "boolean") return value;
  if (typeof value === "string") return value.toLowerCase() === "true";

  return undefined;
};

const getString = (data: any, keys: string[]) => {
  const value = getFromSources(data, keys);
  return typeof value === "string" ? value : undefined;
};

export const getOAuthRequiresOnboarding = (data: any) => {
  const explicitValue = getBoolean(data, [
    "requires_onboarding",
    "requiresOnboarding",
    "need_onboarding",
    "needsOnboarding",
    "new_user",
    "newUser",
    "isNewUser",
  ]);

  if (explicitValue !== undefined) return explicitValue;

  return Boolean(getOAuthSignupToken(data));
};

export const getOAuthSignupToken = (data: any) =>
  getString(data, [
    "oauth_signup_token",
    "oauthSignupToken",
    "signup_token",
    "signupToken",
    "registration_token",
    "registrationToken",
    "temporary_token",
    "temporaryToken",
    "temp_token",
    "tempToken",
  ]);

export const getOAuthEmail = (data: any) =>
  getString(data, ["email", "oauthEmail"]);

export const getOAuthName = (data: any) =>
  getString(data, ["name", "realName", "username", "oauthName"]);

export const savePendingOAuthSignup = (signup: PendingOAuthSignup) => {
  if (!isBrowser()) return;
  window.sessionStorage.setItem(
    OAUTH_SIGNUP_SESSION_KEY,
    JSON.stringify(signup),
  );
};

export const getPendingOAuthSignup = (): PendingOAuthSignup | null => {
  if (!isBrowser()) return null;

  try {
    const raw = window.sessionStorage.getItem(OAUTH_SIGNUP_SESSION_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (
      (parsed?.provider === "google" || parsed?.provider === "kakao") &&
      typeof parsed?.oauthSignupToken === "string"
    ) {
      return {
        provider: parsed.provider,
        oauthSignupToken: parsed.oauthSignupToken,
        rememberMe: Boolean(parsed.rememberMe),
        email: typeof parsed.email === "string" ? parsed.email : undefined,
        name: typeof parsed.name === "string" ? parsed.name : undefined,
      };
    }
  } catch {
    return null;
  }

  return null;
};

export const clearPendingOAuthSignup = () => {
  if (!isBrowser()) return;
  window.sessionStorage.removeItem(OAUTH_SIGNUP_SESSION_KEY);
};
