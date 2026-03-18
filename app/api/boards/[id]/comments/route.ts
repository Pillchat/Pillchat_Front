import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_HOST;

const parseResponse = async (response: Response) => {
  const text = await response.text();

  if (!text.trim()) return null;

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const accessToken = request.headers
      .get("authorization")
      ?.replace("Bearer ", "");

    const response = await fetch(`${API_BASE_URL}/api/boards/${id}/comments`, {
      method: "GET",
      headers: accessToken
        ? {
            Authorization: `Bearer ${accessToken}`,
          }
        : {},
      cache: "no-store",
    });

    const data = await parseResponse(response);

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("게시글 댓글 목록 조회 API 에러:", error);

    return NextResponse.json(
      { message: "댓글 목록을 불러오는데 실패했습니다." },
      { status: 500 },
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const accessToken = request.headers
      .get("authorization")
      ?.replace("Bearer ", "");

    if (!accessToken) {
      return NextResponse.json(
        { message: "인증 토큰이 필요합니다." },
        { status: 401 },
      );
    }

    const body = await request.json();
    const content = body?.content ?? "";

    const query = new URLSearchParams();
    query.set("content", content);

    const response = await fetch(
      `${API_BASE_URL}/api/boards/${id}/comments?${query.toString()}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    const data = await parseResponse(response);

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("게시글 댓글 등록 API 에러:", error);

    return NextResponse.json(
      { message: "댓글 등록에 실패했습니다." },
      { status: 500 },
    );
  }
}
