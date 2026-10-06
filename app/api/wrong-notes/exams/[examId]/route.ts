import { parseBackendError } from "@/lib/server/apiError";
import { mapWrongNoteResponse } from "@/lib/server/wrongNoteResponse";
import { NextRequest, NextResponse } from "next/server";
import { serverFetch } from "@/lib/server/fetch";

// GET /api/wrong-notes/exams/[examId] — 시험지 상세
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ examId: string }> },
) {
  try {
    const { examId } = await params;
    const data = await serverFetch(`/api/wrong-notes/exams/${examId}`, {
      method: "GET",
      request,
    });

    return NextResponse.json(mapWrongNoteResponse(data));
  } catch (error: any) {
    console.error("시험지 상세 조회 에러:", error);
    const errorInfo = parseBackendError(error);
    return NextResponse.json(
      {
        ...errorInfo.data,
        message: errorInfo.message || "시험지 조회에 실패했습니다.",
      },
      { status: errorInfo.status || 500 },
    );
  }
}
