import { NextRequest, NextResponse } from "next/server";

/** Preserve upstream status, errors, empty bodies, and multipart boundaries. */
export async function backendProxy(request: NextRequest, path?: string) {
  const origin = process.env.NEXT_PUBLIC_API_HOST?.replace(/\/$/, "");
  if (!origin)
    return NextResponse.json(
      { message: "API 서버가 설정되지 않았습니다." },
      { status: 503 },
    );
  const headers = new Headers();
  const auth =
    request.headers.get("authorization") ??
    request.cookies.get("access_token")?.value;
  if (auth)
    headers.set(
      "authorization",
      `Bearer ${auth.replace(/^(Bearer\s+)+/i, "")}`,
    );
  for (const key of ["content-type", "temp-token"]) {
    const value = request.headers.get(key);
    if (value) headers.set(key, value);
  }
  try {
    const response = await fetch(
      `${origin}${path ?? request.nextUrl.pathname}${request.nextUrl.search}`,
      {
        method: request.method,
        headers,
        body: ["GET", "HEAD"].includes(request.method)
          ? undefined
          : await request.arrayBuffer(),
        cache: "no-store",
        redirect: "manual",
      },
    );
    if (
      !response.ok &&
      request.method === "POST" &&
      (path ?? request.nextUrl.pathname) === "/api/flashcards/sources"
    ) {
      const error = await response
        .clone()
        .json()
        .catch(() => null);
      // Record the error contract and header presence, never tokens or file contents.
      console.error("AI 카드 원본 업로드 실패", {
        status: response.status,
        authorizationProvided: headers.has("authorization"),
        code: error?.code,
        error: error?.error,
        message: error?.message,
      });
    }
    const responseHeaders = new Headers({ "Cache-Control": "no-store" });
    for (const key of ["content-type", "content-disposition", "retry-after"]) {
      const value = response.headers.get(key);
      if (value) responseHeaders.set(key, value);
    }
    return new NextResponse(response.body, {
      status: response.status,
      headers: responseHeaders,
    });
  } catch {
    return NextResponse.json(
      {
        code: "BACKEND_UNAVAILABLE",
        message: "서버에 연결하지 못했습니다. 잠시 후 다시 시도해주세요.",
      },
      { status: 503 },
    );
  }
}
