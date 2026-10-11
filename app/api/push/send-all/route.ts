import { NextRequest, NextResponse } from "next/server";
import { enqueueAdminPushJob } from "../_pushJob";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, content } = body;

    if (!title || !content) {
      return NextResponse.json(
        { message: "title, content는 필수입니다." },
        { status: 400 },
      );
    }

    const data = await enqueueAdminPushJob(request, {
      ...body,
      audience: "ALL",
    });

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("전체 푸시 발송 API 에러:", error);

    let errorInfo: {
      message?: string;
      status?: number;
      data?: Record<string, unknown>;
    } = {};
    try {
      errorInfo = JSON.parse(error?.message || "{}");
    } catch {
      errorInfo = { message: error?.message };
    }

    return NextResponse.json(
      {
        ...errorInfo.data,
        message:
          errorInfo.message || "백엔드 PushJob 적재 중 오류가 발생했습니다.",
      },
      { status: errorInfo.status || 500 },
    );
  }
}
