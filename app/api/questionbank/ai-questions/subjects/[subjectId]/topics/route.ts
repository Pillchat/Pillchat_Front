import { NextRequest, NextResponse } from "next/server";
import { serverFetch } from "@/lib/functions";

// GET /api/questionbank/ai-questions/subjects/[subjectId]/topics
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ subjectId: string }> },
) {
  try {
    const { subjectId } = await params;
    const data = await serverFetch(
      `/api/ai-questions/premium/subjects/${subjectId}/topics`,
      {
        method: "GET",
        request,
      },
    );

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("토픽 조회 에러:", error);
    const errorInfo = JSON.parse(error.message || "{}");
    return NextResponse.json(
      { message: errorInfo.message || "토픽 조회에 실패했습니다." },
      { status: errorInfo.status || 500 },
    );
  }
}
