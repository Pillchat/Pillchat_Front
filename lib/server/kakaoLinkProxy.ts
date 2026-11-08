import { NextRequest, NextResponse } from "next/server";
import { backendProxy } from "./backendProxy";

// Linking uses an explicit service Bearer token, never ambient cookie auth.
export async function kakaoLinkProxy(request: NextRequest, path: string) {
  if (!/^Bearer\s+\S+$/i.test(request.headers.get("authorization") ?? "")) {
    return NextResponse.json(
      {
        success: false,
        code: "AUTH_REQUIRED",
        message: "기존 필챗 계정으로 먼저 로그인해주세요.",
      },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }
  const response = await backendProxy(request, path);
  response.headers.set("Cache-Control", "no-store");
  return response;
}
