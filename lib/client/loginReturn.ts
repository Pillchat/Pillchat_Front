const LOGIN_RETURN_KEY = "pillchat:login-return-to";

export function safeLoginReturnTo(value: string | null): string | null {
  if (
    !value ||
    value.length > 2048 ||
    /[\s\\]/.test(value) ||
    !value.startsWith("/") ||
    value.startsWith("//")
  )
    return null;
  try {
    const url = new URL(value, "https://pillchat.invalid");
    if (
      url.origin !== "https://pillchat.invalid" ||
      !/^\/learning\/(?:weakness(?:\/(?:areas|mastered|classification))?|recent|history)\/?$/.test(
        url.pathname,
      )
    )
      return null;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return null;
  }
}

function currentReturnTo() {
  return typeof window === "undefined"
    ? null
    : safeLoginReturnTo(
        new URLSearchParams(window.location.search).get("returnTo"),
      );
}

function storedReturnTo() {
  try {
    return typeof window === "undefined"
      ? null
      : safeLoginReturnTo(window.sessionStorage.getItem(LOGIN_RETURN_KEY));
  } catch {
    return null;
  }
}

export function rememberLoginReturnTo() {
  if (typeof window === "undefined") return;
  try {
    const target = currentReturnTo();
    if (target) window.sessionStorage.setItem(LOGIN_RETURN_KEY, target);
    else window.sessionStorage.removeItem(LOGIN_RETURN_KEY);
  } catch {}
}

export function consumeLoginReturnTo() {
  const target = currentReturnTo() ?? storedReturnTo();
  try {
    if (typeof window !== "undefined")
      window.sessionStorage.removeItem(LOGIN_RETURN_KEY);
  } catch {}
  return target ?? "/";
}

export function loginReturnHref() {
  const target = storedReturnTo();
  return target ? `/login?returnTo=${encodeURIComponent(target)}` : "/login";
}
