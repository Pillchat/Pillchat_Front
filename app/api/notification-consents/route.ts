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
    await serverFetch("/api/notification-consents", {
      method: "POST",
      request,
    });

    return new NextResponse(null, { status: 200 });
  } catch (error) {
    const errorInfo = parseRouteError(error);

    return NextResponse.json(
      { message: errorInfo.message || "오픈 알림을 신청하지 못했습니다." },
      { status: errorInfo.status || 500 },
    );
  }
};
