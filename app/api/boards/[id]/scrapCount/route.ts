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

    if (!accessToken) {
      return NextResponse.json(
        { message: "인증 토큰이 필요합니다." },
        { status: 401 },
      );
    }

    const response = await fetch(
      `${API_BASE_URL}/api/boards/${id}/scrapCount`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        cache: "no-store",
      },
    );

    const data = await parseResponse(response);

    return NextResponse.json(data ?? {}, { status: response.status });
  } catch (error) {
    console.error("게시글 스크랩 상태 조회 API 에러:", error);

    return NextResponse.json(
      { message: "게시글 스크랩 상태 조회에 실패했습니다." },
      { status: 502 },
    );
  }
}
