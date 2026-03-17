import { NextRequest, NextResponse } from "next/server";
import { serverFetch } from "@/lib/functions";

// GET /api/wrong-notes — 오답노트 목록 (페이지네이션)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const queryString = searchParams.toString();
    const endpoint = `/api/wrong-notes${queryString ? `?${queryString}` : ""}`;

    const data = await serverFetch(endpoint, {
      method: "GET",
      request,
    });

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("오답노트 목록 조회 에러:", error);
    const errorInfo = JSON.parse(error.message || "{}");
    return NextResponse.json(
      { message: errorInfo.message || "오답노트 목록 조회에 실패했습니다." },
      { status: errorInfo.status || 500 },
    );
  }
}

// POST /api/wrong-notes — 오답노트 생성
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = await serverFetch("/api/wrong-notes", {
      method: "POST",
      data: body,
      request,
    });

    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    console.error("오답노트 생성 에러:", error);
    const errorInfo = JSON.parse(error.message || "{}");
    return NextResponse.json(
      { message: errorInfo.message || "오답노트 생성에 실패했습니다." },
      { status: errorInfo.status || 500 },
    );
  }
}
