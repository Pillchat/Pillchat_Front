import { parseBackendError } from "@/lib/server/apiError";
import { NextRequest, NextResponse } from "next/server";
import { serverFetch } from "@/lib/server/fetch";

// POST /api/questionbank/quiz/:sessionId — 답안 제출 또는 퀴즈 종료
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  try {
    const { sessionId } = await params;
    const body = await request.json();
    const { action, ...rest } = body;

    const endpoint =
      action === "finish"
        ? `/api/quiz/${sessionId}/finish`
        : `/api/quiz/${sessionId}/submit-answer`;

    const data = await serverFetch(endpoint, {
      method: "POST",
      data:
        action === "finish"
          ? undefined
          : { ...rest, action: action === "submit" ? "ANSWER" : action },
      request,
    });

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("퀴즈 액션 에러:", error);
    const errorInfo = parseBackendError(error);
    return NextResponse.json(
      {
        ...errorInfo.data,
        message: errorInfo.message || "요청 처리에 실패했습니다.",
      },
      { status: errorInfo.status || 500 },
    );
  }
}

// GET /api/questionbank/quiz/:sessionId — 퀴즈 결과 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  try {
    const { sessionId } = await params;
    const data = await serverFetch(
      `/api/quiz/${sessionId}${request.nextUrl.searchParams.get("resume") === "true" ? "" : "/result"}`,
      {
        method: "GET",
        request,
      },
    );

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("퀴즈 결과 조회 에러:", error);
    const errorInfo = parseBackendError(error);
    return NextResponse.json(
      {
        ...errorInfo.data,
        message: errorInfo.message || "결과 조회에 실패했습니다.",
      },
      { status: errorInfo.status || 500 },
    );
  }
}
