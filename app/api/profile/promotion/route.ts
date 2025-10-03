import { NextRequest, NextResponse } from "next/server";
import { serverFetch } from "@/lib/functions";

export const GET = async (request: NextRequest) => {
  try {
    const data = await serverFetch("/api/user/me/promotion", {
      method: "GET",
      request,
    });

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error: any) {
    console.error("promotion API 라우트 에러:", error);

    let parsedError;
    try {
      parsedError = JSON.parse(error.message);
    } catch {
      parsedError = {
        status: 500,
        message: error.message || "서버 오류가 발생했습니다.",
      };
    }

    const status = parsedError?.status || 500;
    let message = parsedError?.message || "서버 오류가 발생했습니다.";

    // 상태 코드별 메시지 처리
    switch (status) {
      case 401:
        message = "로그인이 필요합니다.";
        break;
      case 403:
        message = "접근 권한이 없습니다.";
        break;
      case 404:
        message = "승급 정보를 찾을 수 없습니다.";
        break;
      case 500:
        message = "서버 오류가 발생했습니다.";
        break;
    }

    return NextResponse.json({ success: false, message }, { status });
  }
};
