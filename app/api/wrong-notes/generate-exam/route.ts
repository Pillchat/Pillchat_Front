import { NextRequest, NextResponse } from "next/server";
import { serverFetch } from "@/lib/functions";

// POST /api/wrong-notes/generate-exam — AI 시험지 생성
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = await serverFetch("/api/wrong-notes/generate-exam", {
      method: "POST",
      data: body,
      request,
    });

    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    console.error("시험지 생성 에러:", error);
    const errorInfo = JSON.parse(error.message || "{}");
    return NextResponse.json(
      { message: errorInfo.message || "시험지 생성에 실패했습니다." },
      { status: errorInfo.status || 500 },
    );
  }
}
