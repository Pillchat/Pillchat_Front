import { serverFetch } from "@/lib/functions";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ code: string }> },
) {
  try {
    const { code } = await context.params;

    const data = await serverFetch(
      `/api/subjects/${encodeURIComponent(code)}`,
      {
        method: "GET",
        request,
      },
    );

    return NextResponse.json(data);
  } catch (error) {
    console.error("과목 상세 조회 API 에러:", error);

    let errorInfo: { message?: string; status?: number } = {};

    if (error instanceof Error) {
      try {
        errorInfo = JSON.parse(error.message);
      } catch {
        errorInfo = { message: error.message };
      }
    }

    return NextResponse.json(
      { message: errorInfo.message || "과목을 불러오는데 실패했습니다." },
      { status: errorInfo.status || 500 },
    );
  }
}
