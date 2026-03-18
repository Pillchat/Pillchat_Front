import { NextRequest, NextResponse } from "next/server";
import { serverFetch } from "@/lib/functions";

// GET /api/questionbank/ai-questions/result/:taskId — 생성된 문제 결과
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> },
) {
  try {
    const { taskId } = await params;
    const data = await serverFetch(
      `/api/ai-questions/generate/result/${taskId}`,
      { method: "GET", request },
    );

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("생성 결과 조회 에러:", error);
    const errorInfo = JSON.parse(error.message || "{}");
    return NextResponse.json(
      { message: errorInfo.message || "결과 조회에 실패했습니다." },
      { status: errorInfo.status || 500 },
    );
  }
}
