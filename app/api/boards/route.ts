import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_HOST;

export async function POST(request: NextRequest) {
  try {
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

    const params = new URLSearchParams();
    params.set("title", title ?? "");
    params.set("content", content ?? "");
    params.set("category", category ?? "");

    if (Array.isArray(keys)) {
      keys.forEach((key) => {
        if (key) params.append("keys", key);
      });
    }

    const response = await fetch(
      `${API_BASE_URL}/api/boards?${params.toString()}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    const text = await response.text();

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { message: text || "알 수 없는 응답입니다." };
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("게시글 업로드 API 에러:", error);

    return NextResponse.json(
      { message: "게시글 업로드에 실패했습니다." },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const accessToken = request.headers
      .get("authorization")
      ?.replace("Bearer ", "");

    const backendUrl = new URL(`${API_BASE_URL}/api/boards`);

    request.nextUrl.searchParams.forEach((value, key) => {
      backendUrl.searchParams.append(key, value);
    });

    const response = await fetch(backendUrl.toString(), {
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
  } catch (error: any) {
    console.error("게시글 목록 조회 API 에러:", error);

    return NextResponse.json(
      { message: "게시글 목록을 불러오는 데 실패했습니다." },
      { status: 500 },
    );
  }
}
