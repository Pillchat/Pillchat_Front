import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_HOST;
const normalizeToken = (token: string) => token.replace(/^(Bearer\s+)+/i, "");
const getAccessToken = (request: NextRequest) => {
  const authorization = request.headers.get("authorization");
  if (authorization) return normalizeToken(authorization);
  const accessToken = request.cookies.get("access_token")?.value;
  return accessToken ? normalizeToken(accessToken) : "";
};

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

    const response = await fetch(`${API_BASE_URL}/api/boards/${id}/like`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const text = await response.text();

    let data;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = text;
    }

    if (response.status === 204 || data == null) {
      return NextResponse.json({ success: true }, { status: 200 });
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("게시글 좋아요 API 에러:", error);

    return NextResponse.json(
      { message: "게시글 좋아요 처리에 실패했습니다." },
      { status: 500 },
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

    const response = await fetch(`${API_BASE_URL}/api/boards/${id}/like`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const text = await response.text();

    let data;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = text;
    }

    if (response.status === 204 || data == null) {
      return NextResponse.json({ success: true }, { status: 200 });
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("게시글 좋아요 취소 API 에러:", error);

    return NextResponse.json(
      { message: "게시글 좋아요 취소에 실패했습니다." },
      { status: 500 },
    );
  }
}
