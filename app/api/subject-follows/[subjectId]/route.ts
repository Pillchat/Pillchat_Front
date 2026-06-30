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

export const POST = async (
  request: NextRequest,
  context: { params: Promise<{ subjectId: string }> },
) => {
  try {
    const { subjectId } = await context.params;
    const data = await serverFetch(
      `/api/subject-follows/${encodeURIComponent(subjectId)}`,
      {
        method: "POST",
        request,
      },
    );

    return NextResponse.json(data);
  } catch (error) {
    const errorInfo = parseRouteError(error);

    return NextResponse.json(
      { message: errorInfo.message || "관심 과목 구독에 실패했습니다." },
      { status: errorInfo.status || 500 },
    );
  }
};

export const DELETE = async (
  request: NextRequest,
  context: { params: Promise<{ subjectId: string }> },
) => {
  try {
    const { subjectId } = await context.params;
    const data = await serverFetch(
      `/api/subject-follows/${encodeURIComponent(subjectId)}`,
      {
        method: "DELETE",
        request,
      },
    );

    return NextResponse.json(data);
  } catch (error) {
    const errorInfo = parseRouteError(error);

    return NextResponse.json(
      { message: errorInfo.message || "관심 과목 구독 해제에 실패했습니다." },
      { status: errorInfo.status || 500 },
    );
  }
};
