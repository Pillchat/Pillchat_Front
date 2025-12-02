import { NextRequest, NextResponse } from "next/server";
import { ReportCreateRequest } from "@/types/report";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_HOST;

export async function POST(request: NextRequest) {
  try {
    const {
      targetType,
      targetId,
      reasonType,
      reasonDetail,
    }: ReportCreateRequest = await request.json();

    if (!targetType || !reasonType) {
      return NextResponse.json(
        { message: "targetType, targetId, reasonType은 필수입니다." },
        { status: 400 }
      );
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    const authHeader = request.headers.get("authorization");
    if (authHeader) headers["Authorization"] = authHeader;

    const response = await fetch(`${API_BASE_URL}/api/reports`, {
      method: "POST",
      headers,
      // credentials: "include",
      body: JSON.stringify({
        targetType,
        targetId,
        reasonType,
        reasonDetail,
      }),
    });

    if (!response.ok) {
      const backendError = await response.json().catch(() => ({}));
      return NextResponse.json(
        backendError,
        { status: response.status }
      );
    }

    const result = await response.json();
    return NextResponse.json(result, { status: 200 });

  } catch (error: any) {
    console.error("신고 API 에러:", error);
    return NextResponse.json(
      { message: error.message || "서버 오류" },
      { status: 500 }
    );
  }
}
