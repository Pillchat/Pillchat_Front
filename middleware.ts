import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = [
  "/intro",
  "/login",
  "/signup",
  "/find",
  "/onboarding",
  "/learn",
  "/flashcards",
];

const LOGIN_NO_STORE_HEADERS = {
  "Cache-Control": "no-store, no-cache, max-age=0, must-revalidate",
  "CDN-Cache-Control": "no-store",
  "Vercel-CDN-Cache-Control": "no-store",
};

const isLoginPath = (pathname: string) =>
  pathname === "/login" || pathname.startsWith("/login/");

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 공개 경로는 통과
  if (PUBLIC_PATHS.some((path) => pathname.startsWith(path))) {
    const response = NextResponse.next();

    if (isLoginPath(pathname)) {
      for (const [name, value] of Object.entries(LOGIN_NO_STORE_HEADERS)) {
        response.headers.set(name, value);
      }
    }

    return response;
  }

  // 쿠키에서 토큰 확인
  const token = request.cookies.get("access_token")?.value;

  if (!token) {
    const introUrl = new URL("/intro", request.url);
    return NextResponse.redirect(introUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
