import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_HOST;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const accessToken = request.headers
      .get("authorization")
      ?.replace("Bearer ", "");

    const response = await fetch(`${API_BASE_URL}/api/boards/${id}`, {
      method: "GET",
      headers: accessToken
        ? {
            Authorization: `Bearer ${accessToken}`,
          }
        : {},
      cache: "no-store",
    });

    const text = await response.text();

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("게시글 상세 조회 API 에러:", error);

    return NextResponse.json(
      { message: "게시글 상세 정보를 불러오는 데 실패했습니다." },
      { status: 500 },
    );
  }
}

export async function PUT(
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
    const { title, content, category, keys = [] } = body;

    const query = new URLSearchParams();
    query.set("title", title ?? "");
    query.set("content", content ?? "");
    query.set("category", category ?? "");

    if (Array.isArray(keys)) {
      keys.forEach((key) => {
        if (key) query.append("keys", key);
      });
    }

    const response = await fetch(
      `${API_BASE_URL}/api/boards/${id}?${query.toString()}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    const text = await response.text();

    if (!response.ok) {
      let errorData;
      try {
        errorData = JSON.parse(text);
      } catch {
        errorData = { message: text || "게시글 수정에 실패했습니다." };
      }
      return NextResponse.json(errorData, { status: response.status });
    }

    if (!text.trim()) {
      return NextResponse.json(
        { success: true, message: "게시글이 수정되었습니다." },
        { status: 200 },
      );
    }

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { success: true, message: text };
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("게시글 수정 API 에러:", error);

    return NextResponse.json(
      { message: "게시글 수정에 실패했습니다." },
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

    const accessToken = request.headers
      .get("authorization")
      ?.replace("Bearer ", "");

    if (!accessToken) {
      return NextResponse.json(
        { message: "인증 토큰이 필요합니다." },
        { status: 401 },
      );
    }

    const response = await fetch(`${API_BASE_URL}/api/boards/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const text = await response.text();

    if (!response.ok) {
      let errorData;
      try {
        errorData = JSON.parse(text);
      } catch {
        errorData = { message: text || "게시글 삭제에 실패했습니다." };
      }
      return NextResponse.json(errorData, { status: response.status });
    }

    if (!text.trim()) {
      return NextResponse.json(
        { success: true, message: "게시글이 삭제되었습니다." },
        { status: 200 },
      );
    }

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { success: true, message: text };
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("게시글 삭제 API 에러:", error);

    return NextResponse.json(
      { message: "게시글 삭제에 실패했습니다." },
      { status: 500 },
    );
  }
}
