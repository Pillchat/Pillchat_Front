import { NextRequest, NextResponse } from "next/server";
import { serverFetch } from "@/lib/functions";

// GET /api/questionbank/ai-questions/subjects — 프리미엄 과목 목록
export async function GET(request: NextRequest) {
  try {
    const data = await serverFetch("/api/ai-questions/premium/subjects", {
      method: "GET",
      request,
    });

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("과목 목록 조회 에러:", error);
    const errorInfo = JSON.parse(error.message || "{}");
    return NextResponse.json(
      { message: errorInfo.message || "과목 목록 조회에 실패했습니다." },
      { status: errorInfo.status || 500 },
    );
  }
}
