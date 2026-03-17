import { NextRequest, NextResponse } from "next/server";
import { serverFetch } from "@/lib/functions";

// POST /api/wrong-notes/from-question/[questionId] — Q&A에서 자동 생성
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ questionId: string }> },
) {
  try {
    const { questionId } = await params;
    const data = await serverFetch(
      `/api/wrong-notes/from-question/${questionId}`,
      {
        method: "POST",
        request,
      },
    );

    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    console.error("Q&A 오답노트 생성 에러:", error);
    const errorInfo = JSON.parse(error.message || "{}");
    return NextResponse.json(
      { message: errorInfo.message || "오답노트 생성에 실패했습니다." },
      { status: errorInfo.status || 500 },
    );
  }
}
