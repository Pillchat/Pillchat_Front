import { NextRequest, NextResponse } from "next/server";
import { serverFetch } from "@/lib/functions";

// GET /api/questionbank/my-tasks — 내 문제 생성 작업 목록 조회
export async function GET(request: NextRequest) {
  try {
    const data = await serverFetch("/api/ai-questions/my-tasks", {
      method: "GET",
      request,
    });

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("내 작업 목록 조회 에러:", error);
    const errorInfo = JSON.parse(error.message || "{}");
    return NextResponse.json(
      { message: errorInfo.message || "작업 목록 조회에 실패했습니다." },
      { status: errorInfo.status || 500 },
    );
  }
}
