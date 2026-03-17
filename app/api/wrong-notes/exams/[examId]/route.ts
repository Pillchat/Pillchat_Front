import { NextRequest, NextResponse } from "next/server";
import { serverFetch } from "@/lib/functions";

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

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("시험지 상세 조회 에러:", error);
    const errorInfo = JSON.parse(error.message || "{}");
    return NextResponse.json(
      { message: errorInfo.message || "시험지 조회에 실패했습니다." },
      { status: errorInfo.status || 500 },
    );
  }
}
