import { serverFetch } from "@/lib/functions";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const data = await serverFetch(`/api/profile/${id}`, {
      method: "GET",
      request,
    });
    return NextResponse.json(data);
  } catch (error) {
    console.error("프로필 조회 API 에러:", error);

    const errorMessage = error instanceof Error ? error.message : "{}";
    const errorInfo = JSON.parse(errorMessage);
    return NextResponse.json(
      { message: errorInfo.message || "프로필 조회에 실패했습니다." },
      { status: errorInfo.status || 500 },
    );
  }
}
