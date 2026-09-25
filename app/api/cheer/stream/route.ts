import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_HOST;

const normalizeToken = (token: string) => token.replace(/^(Bearer\s+)+/i, "");

const getAccessToken = (request: NextRequest) => {
  const authorization = request.headers.get("authorization");
  if (authorization) return normalizeToken(authorization);

  const accessToken = request.cookies.get("access_token")?.value;
  return accessToken ? normalizeToken(accessToken) : "";
};

const getResumeAfterId = (request: NextRequest) => {
  const lastEventId = request.headers.get("last-event-id");
  const requestedAfterId = request.nextUrl.searchParams.get("afterId");
  const candidate = lastEventId || requestedAfterId;

  return candidate && /^\d+$/.test(candidate) ? candidate : null;
};

export async function GET(request: NextRequest) {
  if (!API_BASE_URL) {
    return NextResponse.json(
      { message: "백엔드 API 주소가 설정되지 않았습니다." },
      { status: 500 },
    );
  }

  const accessToken = getAccessToken(request);
  if (!accessToken) {
    return NextResponse.json(
      { message: "로그인이 필요합니다." },
      { status: 401 },
    );
  }

  const backendUrl = new URL(
    `${API_BASE_URL.replace(/\/$/, "")}/api/cheer/stream`,
  );
  const resumeAfterId = getResumeAfterId(request);
  if (resumeAfterId) backendUrl.searchParams.set("afterId", resumeAfterId);

  try {
    const backendResponse = await fetch(backendUrl, {
      method: "GET",
      headers: {
        Accept: "text/event-stream",
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
      signal: request.signal,
    });

    if (!backendResponse.ok || !backendResponse.body) {
      const errorBody = await backendResponse.text();

      return NextResponse.json(
        {
          message: errorBody || "응원방 실시간 연결을 시작하지 못했습니다.",
        },
        { status: backendResponse.status || 502 },
      );
    }

    return new Response(backendResponse.body, {
      status: 200,
      headers: {
        "Cache-Control": "no-cache, no-transform",
        "Content-Type": "text/event-stream; charset=utf-8",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error) {
    if (request.signal.aborted) {
      return new Response(null, { status: 499 });
    }

    console.error("Cheer SSE proxy failed:", error);
    return NextResponse.json(
      { message: "응원방 실시간 연결에 실패했습니다." },
      { status: 502 },
    );
  }
}
