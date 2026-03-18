import { NextRequest, NextResponse } from "next/server";
import { serverFetch } from "@/lib/functions";

// GET /api/questionbank/bookmarks — 북마크 목록 조회
export async function GET(request: NextRequest) {
  try {
    const data = await serverFetch("/api/bookmarks", {
      method: "GET",
      request,
    });

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("북마크 목록 조회 에러:", error);
    const errorInfo = JSON.parse(error.message || "{}");
    return NextResponse.json(
      { message: errorInfo.message || "북마크 조회에 실패했습니다." },
      { status: errorInfo.status || 500 },
    );
  }
}

// POST /api/questionbank/bookmarks — 북마크 토글
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = await serverFetch("/api/bookmarks/toggle", {
      method: "POST",
      data: body,
      request,
    });

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("북마크 토글 에러:", error);
    const errorInfo = JSON.parse(error.message || "{}");
    return NextResponse.json(
      { message: errorInfo.message || "북마크 변경에 실패했습니다." },
      { status: errorInfo.status || 500 },
    );
  }
}
