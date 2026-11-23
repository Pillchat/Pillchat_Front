import { safeLoginReturnTo } from "../client/loginReturn";

const publicAuthRoutes = ["/login", "/signup", "/find", "/onboarding"];
export const accountLinkCallback = "/settings/account/kakao/callback";

export function isPublicPage(pathname: string) {
  return (
    pathname === accountLinkCallback ||
    publicAuthRoutes.some(
      (route) => pathname === route || pathname.startsWith(`${route}/`),
    )
  );
}

export function loginHrefForPage(pathAndQuery: string) {
  const returnTo = safeLoginReturnTo(pathAndQuery);
  return returnTo
    ? `/login?returnTo=${encodeURIComponent(returnTo)}`
    : "/login";
}
