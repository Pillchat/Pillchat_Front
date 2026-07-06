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

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 공개 경로는 통과
  if (PUBLIC_PATHS.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
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
