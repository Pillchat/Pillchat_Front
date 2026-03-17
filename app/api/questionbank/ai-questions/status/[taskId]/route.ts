import { NextRequest, NextResponse } from "next/server";
import { serverFetch } from "@/lib/functions";

// GET /api/questionbank/ai-questions/status/:taskId — 생성 진행 상태
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> },
) {
  try {
    const { taskId } = await params;
    const data = await serverFetch(
      `/api/ai-questions/generate/status/${taskId}`,
      { method: "GET", request },
    );

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("생성 상태 조회 에러:", error);
    const errorInfo = JSON.parse(error.message || "{}");
    return NextResponse.json(
      { message: errorInfo.message || "상태 조회에 실패했습니다." },
      { status: errorInfo.status || 500 },
    );
  }
}
