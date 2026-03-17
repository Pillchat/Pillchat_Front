import { NextRequest, NextResponse } from "next/server";
import { serverFetch } from "@/lib/functions";

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
    const errorInfo = JSON.parse(error.message || "{}");
    return NextResponse.json(
      { message: errorInfo.message || "PDF 추출 상태 조회에 실패했습니다." },
      { status: errorInfo.status || 500 },
    );
  }
}
