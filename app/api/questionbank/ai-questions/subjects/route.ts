import { parseBackendError } from "@/lib/server/apiError";
import { NextRequest, NextResponse } from "next/server";
import { serverFetch } from "@/lib/server/fetch";

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
    const errorInfo = parseBackendError(error);
    return NextResponse.json(
      {
        ...errorInfo.data,
        message: errorInfo.message || "과목 목록 조회에 실패했습니다.",
      },
      { status: errorInfo.status || 500 },
    );
  }
}
