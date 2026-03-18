import { NextRequest, NextResponse } from "next/server";
import { serverFetch } from "@/lib/functions";

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
    const errorInfo = JSON.parse(error.message || "{}");
    return NextResponse.json(
      { message: errorInfo.message || "복습 카테고리 조회에 실패했습니다." },
      { status: errorInfo.status || 500 },
    );
  }
}
