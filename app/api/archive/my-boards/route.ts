import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_HOST;

const normalizeToken = (token: string) => token.replace(/^(Bearer\s+)+/i, "");

const getAccessToken = (request: NextRequest) => {
  const authorization = request.headers.get("authorization");
  if (authorization) return normalizeToken(authorization);

  const accessToken = request.cookies.get("access_token")?.value;
  return accessToken ? normalizeToken(accessToken) : "";
};

const parseResponse = async (response: Response) => {
  const text = await response.text();

  if (!text.trim()) return null;

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};

const errorBody = (data: unknown, fallbackMessage: string) => {
  if (data && typeof data === "object") return data;
  if (typeof data === "string" && data.trim()) return { message: data };
  return { message: fallbackMessage };
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

  try {
    const response = await fetch(`${API_BASE_URL}/api/archive/my-boards`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    });
    const data = await parseResponse(response);

    if (!response.ok) {
      return NextResponse.json(
        errorBody(data, "내가 쓴 글을 불러오지 못했습니다."),
        { status: response.status },
      );
    }

    return NextResponse.json(data ?? [], { status: 200 });
  } catch (error) {
    console.error("내가 쓴 글 API 오류:", error);

    return NextResponse.json(
      { message: "내가 쓴 글을 불러오지 못했습니다." },
      { status: 502 },
    );
  }
}
