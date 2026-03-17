import { NextRequest, NextResponse } from "next/server";
import { serverFetch } from "@/lib/functions";

// GET /api/questionbank/review — 풀었던 문제 조회 (필터 지원)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const queryString = searchParams.toString();
    const endpoint = `/api/review/questions${queryString ? `?${queryString}` : ""}`;

    const data = await serverFetch(endpoint, {
      method: "GET",
      request,
    });

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("복습 문제 조회 에러:", error);
    const errorInfo = JSON.parse(error.message || "{}");
    return NextResponse.json(
      { message: errorInfo.message || "복습 문제 조회에 실패했습니다." },
      { status: errorInfo.status || 500 },
    );
  }
}
