import { parseBackendError } from "@/lib/server/apiError";
import { mapWrongNoteResponse } from "@/lib/server/wrongNoteResponse";
import { NextRequest, NextResponse } from "next/server";
import { serverFetch } from "@/lib/server/fetch";

// POST /api/wrong-notes/[noteId]/like — 좋아요 토글
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ noteId: string }> },
) {
  try {
    const { noteId } = await params;
    const data = await serverFetch(`/api/wrong-notes/${noteId}/like`, {
      method: "POST",
      request,
    });

    return NextResponse.json(mapWrongNoteResponse(data));
  } catch (error: any) {
    console.error("좋아요 토글 에러:", error);
    const errorInfo = parseBackendError(error);
    return NextResponse.json(
      {
        ...errorInfo.data,
        message: errorInfo.message || "좋아요 처리에 실패했습니다.",
      },
      { status: errorInfo.status || 500 },
    );
  }
}
