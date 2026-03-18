import { serverFetch } from "@/lib/functions";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const data = await serverFetch("/api/materials/all", {
      method: "GET",
      request,
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error("학습자료 전체 조회 API 에러:", error);
    const errorMessage = error instanceof Error ? error.message : "{}";

    let errorInfo: { message?: string; status?: number } = {};
    try {
      errorInfo = JSON.parse(errorMessage);
    } catch {
      errorInfo = {
        message: "학습자료를 불러오는데 실패했습니다.",
        status: 500,
      };
    }

    return NextResponse.json(
      { message: errorInfo.message || "학습자료를 불러오는데 실패했습니다." },
      { status: errorInfo.status || 500 },
    );
  }
}
