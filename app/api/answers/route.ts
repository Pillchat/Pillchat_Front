import { NextRequest, NextResponse } from "next/server";
import { serverFetch } from "@/lib/functions";

export const POST = async (request: NextRequest) => {
  try {
    const body = await request.json();
    const { questionId, steps, subjectId } = body;

    // 토큰 확인
    const authorization = request.headers.get("authorization");
    if (!authorization) {
      return NextResponse.json(
        { success: false, message: "인증이 필요합니다." },
        { status: 401 },
      );
    }

    const data = await serverFetch("/api/answers", {
      method: "POST",
      data: { questionId, steps, subjectId },
      request,
    });

    return NextResponse.json({
      success: true,
      data: data,
    });
  } catch (error: any) {
    console.error("답변 등록 API 에러:", error);

    const errorInfo = JSON.parse(error.message || "{}");
    return NextResponse.json(
      {
        success: false,
        message: errorInfo.message || "답변 등록에 실패했습니다.",
      },
      { status: errorInfo.status || 500 },
    );
  }
};
