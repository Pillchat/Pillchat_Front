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

export const PATCH = async (request: NextRequest) => {
  try {
    const payload = (await request.json()) as { isPublic?: unknown };
    if (typeof payload.isPublic !== "boolean") {
      return NextResponse.json(
        { message: "프로필 공개 여부가 올바르지 않습니다." },
        { status: 400 },
      );
    }

    const data = await serverFetch("/api/profile/visibility", {
      method: "PATCH",
      data: { isPublic: payload.isPublic },
      request,
    });

    return NextResponse.json(data);
  } catch (error) {
    const errorInfo = parseRouteError(error);

    return NextResponse.json(
      {
        message: errorInfo.message || "프로필 공개 설정을 변경하지 못했습니다.",
      },
      { status: errorInfo.status || 500 },
    );
  }
};
