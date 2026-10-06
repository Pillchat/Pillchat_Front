import { parseBackendError } from "@/lib/server/apiError";
import { NextRequest, NextResponse } from "next/server";
import { serverFetch } from "@/lib/server/fetch";

// GET /api/questionbank/pdf/:fileId/extract — PDF 추출 상태 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> },
) {
  try {
    const { fileId } = await params;
    const data = await serverFetch(`/api/pdf/${fileId}/extract`, {
      method: "GET",
      request,
    });

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("PDF 추출 상태 조회 에러:", error);
    const errorInfo = parseBackendError(error);
    return NextResponse.json(
      {
        ...errorInfo.data,
        message: errorInfo.message || "PDF 추출 상태 조회에 실패했습니다.",
      },
      { status: errorInfo.status || 500 },
    );
  }
}
