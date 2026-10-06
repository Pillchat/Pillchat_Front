import { parseBackendError } from "@/lib/server/apiError";
import { NextRequest, NextResponse } from "next/server";
import { serverFetch } from "@/lib/server/fetch";

// GET /api/questionbank/review/categories?sourceType=PDF|PREMIUM
// → 백엔드 GET /api/review/categories?sourceType=...
export async function GET(request: NextRequest) {
  try {
    const queryString = request.nextUrl.searchParams.toString();
    const endpoint = `/api/review/categories${queryString ? `?${queryString}` : ""}`;

    const data = await serverFetch(endpoint, {
      method: "GET",
      request,
    });

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("복습 카테고리 조회 에러:", error);
    const errorInfo = parseBackendError(error);
    return NextResponse.json(
      {
        ...errorInfo.data,
        message: errorInfo.message || "복습 카테고리 조회에 실패했습니다.",
      },
      { status: errorInfo.status || 500 },
    );
  }
}
