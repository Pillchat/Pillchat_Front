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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ commentId: string }> },
) {
  try {
    const { commentId } = await params;

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
      `${API_BASE_URL}/api/boards/comments/${commentId}?${query.toString()}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    const data = await parseResponse(response);

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("게시글 댓글 수정 API 에러:", error);

    return NextResponse.json(
      { message: "댓글 수정에 실패했습니다." },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ commentId: string }> },
) {
  try {
    const { commentId } = await params;

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
      `${API_BASE_URL}/api/boards/comments/${commentId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    const data = await parseResponse(response);

    if (!response.ok) {
      return NextResponse.json(
        data && typeof data === "object"
          ? data
          : { message: "댓글 삭제에 실패했습니다." },
        { status: response.status },
      );
    }

    if (response.status === 204 || data == null) {
      return NextResponse.json(
        { success: true, message: "댓글이 삭제되었습니다." },
        { status: 200 },
      );
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("게시글 댓글 삭제 API 에러:", error);

    return NextResponse.json(
      { message: "댓글 삭제에 실패했습니다." },
      { status: 500 },
    );
  }
}