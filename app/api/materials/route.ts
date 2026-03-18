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

    const response = await fetch(`${API_BASE_URL}/api/materials`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(body),
    });

    const text = await response.text();

    if (!response.ok) {
      let errorData;
      try {
        errorData = JSON.parse(text);
      } catch {
        errorData = { message: text || "학습자료 업로드에 실패했습니다." };
      }
      return NextResponse.json(errorData, { status: response.status });
    }

    if (!text.trim()) {
      return NextResponse.json(
        { success: true, message: "학습자료가 업로드되었습니다." },
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
    console.error("학습자료 업로드 API 에러:", error);

    return NextResponse.json(
      { message: "학습자료 업로드에 실패했습니다." },
      { status: 500 },
    );
  }
}
