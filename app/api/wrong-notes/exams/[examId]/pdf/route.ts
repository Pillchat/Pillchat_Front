import { NextRequest, NextResponse } from "next/server";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:8080";

// GET /api/wrong-notes/exams/[examId]/pdf — PDF 다운로드 (바이너리 프록시)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ examId: string }> },
) {
  try {
    const { examId } = await params;
    const token = request.headers.get("authorization");

    const res = await fetch(`${BASE_URL}/api/wrong-notes/exams/${examId}/pdf`, {
      method: "GET",
      headers: {
        ...(token ? { Authorization: token } : {}),
      },
    });

    if (!res.ok) {
      return NextResponse.json(
        { message: "PDF 다운로드에 실패했습니다." },
        { status: res.status },
      );
    }

    const blob = await res.blob();
    return new NextResponse(blob, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="exam-${examId}.pdf"`,
      },
    });
  } catch (error: any) {
    console.error("PDF 다운로드 에러:", error);
    return NextResponse.json(
      { message: "PDF 다운로드에 실패했습니다." },
      { status: 500 },
    );
  }
}
