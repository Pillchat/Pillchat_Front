import { serverFetch } from "@/lib/server/fetch";
import { NotificationSettingUpdateRequest } from "@/types/notification";
import { NextRequest, NextResponse } from "next/server";

const parseRouteError = (error: unknown) => {
  if (!(error instanceof Error)) return {};

  try {
    return JSON.parse(error.message) as { message?: string; status?: number };
  } catch {
    return { message: error.message };
  }
};

export const GET = async (request: NextRequest) => {
  try {
    const data = await serverFetch("/api/notification-settings", {
      method: "GET",
      request,
    });

    return NextResponse.json(data);
  } catch (error) {
    const errorInfo = parseRouteError(error);

    return NextResponse.json(
      { message: errorInfo.message || "알림 설정을 불러오지 못했습니다." },
      { status: errorInfo.status || 500 },
    );
  }
};

export const PUT = async (request: NextRequest) => {
  try {
    const body = (await request.json()) as NotificationSettingUpdateRequest;

    const data = await serverFetch("/api/notification-settings", {
      method: "PUT",
      data: body,
      request,
    });

    return NextResponse.json(data);
  } catch (error) {
    const errorInfo = parseRouteError(error);

    return NextResponse.json(
      { message: errorInfo.message || "알림 설정을 저장하지 못했습니다." },
      { status: errorInfo.status || 500 },
    );
  }
};
