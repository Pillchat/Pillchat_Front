import { parseBackendError } from "@/lib/server/apiError";
import { NextRequest, NextResponse } from "next/server";
import { serverFetch } from "@/lib/server/fetch";

// POST /api/questionbank/ai-questions — AI 문제 생성 (PDF / Premium)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, ...rest } = body;

    const endpoint =
      type === "premium"
        ? "/api/ai-questions/generate/premium"
        : "/api/ai-questions/generate/from-pdf";

    const data = await serverFetch(endpoint, {
      method: "POST",
      data: rest,
      request,
    });

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("AI 문제 생성 에러:", error);
    const errorInfo = parseBackendError(error);
    return NextResponse.json(
      {
        ...errorInfo.data,
        message: errorInfo.message || "문제 생성에 실패했습니다.",
      },
      { status: errorInfo.status || 500 },
    );
  }
}
