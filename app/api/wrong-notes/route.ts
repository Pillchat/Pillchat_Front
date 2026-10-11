import { parseBackendError } from "@/lib/server/apiError";
import { mapWrongNoteResponse } from "@/lib/server/wrongNoteResponse";
import { NextRequest, NextResponse } from "next/server";
import { serverFetch } from "@/lib/server/fetch";
import { getRequestUserId, isOwnedByRequestUser } from "./_auth";

// GET /api/wrong-notes — 오답노트 목록 (페이지네이션)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const queryString = searchParams.toString();
    const endpoint = `/api/wrong-notes${queryString ? `?${queryString}` : ""}`;

    const data = await serverFetch(endpoint, {
      method: "GET",
      request,
    });

    const requestUserId = getRequestUserId(request);
    const responseData = data?.data ?? data;
    const content = responseData?.content;

    if (Array.isArray(content)) {
      const filteredContent = content.filter((item: any) =>
        isOwnedByRequestUser(item, requestUserId),
      );
      const filteredResponseData = {
        ...responseData,
        content: filteredContent.map(mapWrongNoteResponse),
      };

      return NextResponse.json(
        data?.data
          ? { ...data, data: filteredResponseData }
          : filteredResponseData,
      );
    }

    return NextResponse.json(mapWrongNoteResponse(data));
  } catch (error: any) {
    console.error("오답노트 목록 조회 에러:", error);
    const errorInfo = parseBackendError(error);
    return NextResponse.json(
      {
        ...errorInfo.data,
        message: errorInfo.message || "오답노트 목록 조회에 실패했습니다.",
      },
      { status: errorInfo.status || 500 },
    );
  }
}

// POST /api/wrong-notes — 오답노트 생성
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = await serverFetch("/api/wrong-notes", {
      method: "POST",
      data: body,
      request,
    });

    return NextResponse.json(mapWrongNoteResponse(data), { status: 201 });
  } catch (error: any) {
    console.error("오답노트 생성 에러:", error);
    const errorInfo = parseBackendError(error);
    return NextResponse.json(
      {
        ...errorInfo.data,
        message: errorInfo.message || "오답노트 생성에 실패했습니다.",
      },
      { status: errorInfo.status || 500 },
    );
  }
}
