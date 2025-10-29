import { serverFetch } from "@/lib/functions";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;

    const data = await serverFetch(`/api/answers/${id}/accept`, {
      method: "POST",
      request,
    });

    return NextResponse.json({
      success: true,
      data: data,
    });
  } catch (error: unknown) {
    console.error("답변 채택 API 에러:", error);

    const errorMessage = error instanceof Error ? error.message : "{}";
    const errorInfo = JSON.parse(errorMessage);
    return NextResponse.json(
      { message: errorInfo.message || "답변 채택에 실패했습니다." },
      { status: errorInfo.status || 500 },
    );
  }
}
