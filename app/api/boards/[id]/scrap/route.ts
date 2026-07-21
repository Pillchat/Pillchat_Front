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

const getAccessToken = (request: NextRequest) =>
  request.headers.get("authorization")?.replace(/^(Bearer\s+)+/i, "") ||
  request.cookies.get("access_token")?.value?.replace(/^(Bearer\s+)+/i, "") ||
  "";

const buildErrorBody = (data: unknown, fallbackMessage: string) =>
  data && typeof data === "object" ? data : { message: fallbackMessage };

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const accessToken = getAccessToken(request);

    if (!accessToken) {
      return NextResponse.json(
        { message: "인증 토큰이 필요합니다." },
        { status: 401 },
      );
    }

    const response = await fetch(`${API_BASE_URL}/api/boards/${id}/scrap`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const data = await parseResponse(response);

    if (!response.ok) {
      return NextResponse.json(
        buildErrorBody(data, "게시글 스크랩 처리에 실패했습니다."),
        { status: response.status },
      );
    }

    if (response.status === 204 || data == null) {
      return NextResponse.json({ success: true }, { status: 200 });
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("게시글 스크랩 API 에러:", error);

    return NextResponse.json(
      { message: "게시글 스크랩 처리에 실패했습니다." },
      { status: 502 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const accessToken = getAccessToken(request);

    if (!accessToken) {
      return NextResponse.json(
        { message: "인증 토큰이 필요합니다." },
        { status: 401 },
      );
    }

    const response = await fetch(`${API_BASE_URL}/api/boards/${id}/scrap`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const data = await parseResponse(response);

    if (!response.ok) {
      return NextResponse.json(
        buildErrorBody(data, "게시글 스크랩 취소에 실패했습니다."),
        { status: response.status },
      );
    }

    if (response.status === 204 || data == null) {
      return NextResponse.json({ success: true }, { status: 200 });
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("게시글 스크랩 취소 API 에러:", error);

    return NextResponse.json(
      { message: "게시글 스크랩 취소에 실패했습니다." },
      { status: 502 },
    );
  }
}
