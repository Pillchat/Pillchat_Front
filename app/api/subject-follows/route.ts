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

export const GET = async (request: NextRequest) => {
  try {
    const data = await serverFetch("/api/subject-follows", {
      method: "GET",
      request,
    });

    return NextResponse.json(data);
  } catch (error) {
    const errorInfo = parseRouteError(error);

    return NextResponse.json(
      { message: errorInfo.message || "관심 과목 목록을 불러오지 못했습니다." },
      { status: errorInfo.status || 500 },
    );
  }
};
