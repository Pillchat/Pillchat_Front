import { NextRequest, NextResponse } from "next/server";
import { serverFetch } from "@/lib/functions";

// POST /api/questionbank/quiz — 퀴즈 세션 시작
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = await serverFetch("/api/quiz/start", {
      method: "POST",
      data: body,
      request,
    });

    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    console.error("퀴즈 시작 에러:", error);
    const errorInfo = JSON.parse(error.message || "{}");
    return NextResponse.json(
      { message: errorInfo.message || "퀴즈 시작에 실패했습니다." },
      { status: errorInfo.status || 500 },
    );
  }
}
