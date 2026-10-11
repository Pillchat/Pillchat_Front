import { parseBackendError } from "@/lib/server/apiError";
import { NextRequest, NextResponse } from "next/server";
import { serverFetch } from "@/lib/server/fetch";

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
    const errorInfo = parseBackendError(error);
    return NextResponse.json(
      {
        ...errorInfo.data,
        message: errorInfo.message || "토픽 조회에 실패했습니다.",
      },
      { status: errorInfo.status || 500 },
    );
  }
}
