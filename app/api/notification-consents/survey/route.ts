import { serverFetch } from "@/lib/server/fetch";
import { NextRequest, NextResponse } from "next/server";

const parseRouteError = (error: unknown) => {
  if (!(error instanceof Error)) return {};

  try {
    return JSON.parse(error.message) as { message?: string; status?: number };
  } catch {
    return { message: error.message };
  }
};

export const POST = async (request: NextRequest) => {
  try {
    const payload = await request.json();
    const data = await serverFetch("/api/notification-consents/survey", {
      method: "POST",
      data: payload,
      request,
    });

    return NextResponse.json(data);
  } catch (error) {
    const errorInfo = parseRouteError(error);

    return NextResponse.json(
      {
        message:
          errorInfo.message ||
          "알림 신청과 기대 기능 설문을 완료하지 못했습니다.",
      },
      { status: errorInfo.status || 500 },
    );
  }
};
