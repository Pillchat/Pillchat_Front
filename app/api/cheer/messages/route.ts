import { NextRequest, NextResponse } from "next/server";

import { serverFetch } from "@/lib/server/fetch";

const parseRouteError = (error: unknown) => {
  if (!(error instanceof Error)) return {};

  try {
    return JSON.parse(error.message) as { message?: string; status?: number };
  } catch {
    return { message: error.message };
  }
};

const createErrorResponse = (error: unknown, fallbackMessage: string) => {
  const errorInfo = parseRouteError(error);

  return NextResponse.json(
    { message: errorInfo.message || fallbackMessage },
    { status: errorInfo.status || 500 },
  );
};

export async function GET(request: NextRequest) {
  try {
    const backendParams = new URLSearchParams();
    const beforeId = request.nextUrl.searchParams.get("beforeId");
    const size = request.nextUrl.searchParams.get("size");

    if (beforeId) backendParams.set("beforeId", beforeId);
    if (size) backendParams.set("size", size);

    const query = backendParams.toString();
    const data = await serverFetch(
      `/api/cheer/messages${query ? `?${query}` : ""}`,
      {
        method: "GET",
        request,
      },
    );
    const response = NextResponse.json(data);
    response.headers.set("Cache-Control", "no-store");

    return response;
  } catch (error) {
    return createErrorResponse(
      error,
      "응원 메시지를 불러오지 못했습니다. 다시 시도해주세요.",
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as { content?: unknown };

    if (typeof payload.content !== "string") {
      return NextResponse.json(
        { message: "응원 메시지를 입력해주세요." },
        { status: 400 },
      );
    }

    const data = await serverFetch("/api/cheer/messages", {
      method: "POST",
      data: { content: payload.content },
      request,
    });

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return createErrorResponse(
      error,
      "응원 메시지를 전송하지 못했습니다. 다시 시도해주세요.",
    );
  }
}
