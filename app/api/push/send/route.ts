import { NextRequest, NextResponse } from "next/server";
import { enqueueAdminPushJob, normalizeUserIds } from "../_pushJob";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userIds, title, content } = body;

    if (!userIds || !title || !content) {
      return NextResponse.json(
        { message: "userIds, title, content는 필수입니다." },
        { status: 400 },
      );
    }

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json(
        { message: "userIds는 배열 형식이어야 합니다." },
        { status: 400 },
      );
    }

    const normalizedUserIds = normalizeUserIds(userIds);
    if (normalizedUserIds.length !== userIds.length) {
      return NextResponse.json(
        { message: "유저 ID는 숫자만 입력할 수 있습니다." },
        { status: 400 },
      );
    }

    const data = await enqueueAdminPushJob(request, {
      ...body,
      audience: "USERS",
      userIds: normalizedUserIds,
    });

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("개인 푸시 발송 API 에러:", error);

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
