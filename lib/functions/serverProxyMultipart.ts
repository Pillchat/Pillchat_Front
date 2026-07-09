import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_HOST;
const normalizeToken = (token: string) => token.replace(/^(Bearer\s+)+/i, "");

/**
 * 클라이언트 요청을 백엔드로 그대로 프록시 (multipart / JSON 모두 지원)
 * - Content-Type(boundary 포함)과 body를 원본 그대로 전달
 * - Authorization 헤더 자동 전달
 */
export async function proxyToBackend(
  request: NextRequest,
  backendPath: string,
  method: string,
) {
  const accessToken = request.cookies.get("access_token")?.value;
  const authHeader = request.headers.get("authorization");
  const auth = authHeader
    ? `Bearer ${normalizeToken(authHeader)}`
    : accessToken
      ? `Bearer ${normalizeToken(accessToken)}`
      : null;
  const contentType = request.headers.get("content-type");
  const body = method === "GET" ? undefined : await request.arrayBuffer();

  const headers: Record<string, string> = {};
  if (auth) headers["Authorization"] = auth;
  if (contentType) headers["Content-Type"] = contentType;

  const res = await fetch(`${API_BASE_URL}${backendPath}`, {
    method,
    headers,
    body,
  });

  if (res.status === 204) {
    return new NextResponse(null, { status: 204 });
  }

  const text = await res.text();
  if (!text.trim()) {
    return NextResponse.json({}, { status: res.status });
  }

  try {
    return NextResponse.json(JSON.parse(text), { status: res.status });
  } catch {
    return NextResponse.json({ message: text }, { status: res.status });
  }
}
