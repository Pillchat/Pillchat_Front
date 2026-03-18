import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_HOST;

// POST /api/questionbank/pdf — PDF 업로드
export async function POST(request: NextRequest) {
  try {
    const headers: Record<string, string> = {};
    const authorization = request.headers.get("authorization");
    if (authorization) headers["Authorization"] = authorization;

    const formData = await request.formData();

    const response = await fetch(`${API_BASE_URL}/api/pdf/upload`, {
      method: "POST",
      headers,
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return NextResponse.json(error, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("PDF 업로드 에러:", error);
    return NextResponse.json(
      { message: "PDF 업로드에 실패했습니다." },
      { status: 500 },
    );
  }
}
