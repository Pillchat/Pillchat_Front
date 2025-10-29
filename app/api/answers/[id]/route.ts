import { NextRequest, NextResponse } from "next/server";
import { serverFetch } from "@/lib/functions";

// 개별 답변 조회
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const data = await serverFetch(`/api/answers/${id}`, {
      method: "GET",
      request,
    });

    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error("답변 상세 조회 API 에러:", error);

    const errorMessage = error instanceof Error ? error.message : "{}";
    const errorInfo = JSON.parse(errorMessage);
    return NextResponse.json(
      { message: errorInfo.message || "답변을 불러오는데 실패했습니다." },
      { status: errorInfo.status || 500 },
    );
  }
}

// 답변 수정
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const { questionId, steps } = body;

    const headers: Record<string, string> = {};

    // 토큰 확인
    if (request) {
      const authorization = request.headers.get("authorization");
      if (authorization) {
        headers["Authorization"] = authorization;
      }
    }

    const data = await serverFetch(`/api/answers/${id}`, {
      method: "PUT",
      data: {
        questionId,
        steps,
      },
      request,
    });

    return NextResponse.json({
      success: true,
      data: data,
    });
  } catch (error: any) {
    console.error("답변 수정 API 에러:", error);

    const errorInfo = JSON.parse(error.message || "{}");
    return NextResponse.json(
      {
        success: false,
        message: errorInfo.message || "답변 수정에 실패했습니다.",
      },
      { status: errorInfo.status || 500 },
    );
  }
}
