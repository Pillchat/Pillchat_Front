import { serverFetch } from "@/lib/functions";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;

    const data = await serverFetch(`/api/questions/${id}/like`, {
      method: "POST",
      request,
    });

    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error("질문 좋아요 생성 API 에러:", error);

    const errorMessage = error instanceof Error ? error.message : "{}";
    const errorInfo = JSON.parse(errorMessage);
    return NextResponse.json(
      { message: errorInfo.message || "질문 좋아요 생성에 실패했습니다." },
      { status: errorInfo.status || 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;

    const data = await serverFetch(`/api/questions/${id}/like`, {
      method: "DELETE",
      request,
    });

    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error("질문 좋아요 삭제 API 에러:", error);

    const errorMessage = error instanceof Error ? error.message : "{}";
    const errorInfo = JSON.parse(errorMessage);
    return NextResponse.json(
      { message: errorInfo.message || "질문 좋아요 삭제에 실패했습니다." },
      { status: errorInfo.status || 500 },
    );
  }
}
