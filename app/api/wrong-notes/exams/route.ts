import { parseBackendError } from "@/lib/server/apiError";
import { mapWrongNoteResponse } from "@/lib/server/wrongNoteResponse";
import { NextRequest, NextResponse } from "next/server";
import { serverFetch } from "@/lib/server/fetch";

// GET /api/wrong-notes/exams — 시험지 목록
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const queryString = searchParams.toString();
    const endpoint = `/api/wrong-notes/exams${queryString ? `?${queryString}` : ""}`;

    const data = await serverFetch(endpoint, {
      method: "GET",
      request,
    });

    return NextResponse.json(mapWrongNoteResponse(data));
  } catch (error: any) {
    console.error("시험지 목록 조회 에러:", error);
    const errorInfo = parseBackendError(error);
    return NextResponse.json(
      {
        ...errorInfo.data,
        message: errorInfo.message || "시험지 목록 조회에 실패했습니다.",
      },
      { status: errorInfo.status || 500 },
    );
  }
}
