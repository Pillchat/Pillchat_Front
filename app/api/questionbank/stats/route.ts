import { NextRequest, NextResponse } from "next/server";
import { serverFetch } from "@/lib/functions";

// GET /api/questionbank/stats — 통계 조회 (type 쿼리로 분기)
export async function GET(request: NextRequest) {
  try {
    const type = request.nextUrl.searchParams.get("type") || "summary";

    const endpointMap: Record<string, string> = {
      summary: "/api/stats/my-summary",
      subject: "/api/stats/by-subject",
      topic: "/api/stats/by-topic",
    };

    const endpoint = endpointMap[type] || endpointMap.summary;
    const data = await serverFetch(endpoint, {
      method: "GET",
      request,
    });

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("통계 조회 에러:", error);
    const errorInfo = JSON.parse(error.message || "{}");
    return NextResponse.json(
      { message: errorInfo.message || "통계 조회에 실패했습니다." },
      { status: errorInfo.status || 500 },
    );
  }
}
