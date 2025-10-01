import { NextRequest, NextResponse } from "next/server";
import { serverFetch } from "@/lib/functions";

export const DELETE = async (request: NextRequest) => {
  try {
    const data = await serverFetch("/api/auth/delete-account", {
      method: "DELETE",
      data: { immediate: true },
      request,
    });

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error: any) {
    let parsedError;
    try {
      parsedError = JSON.parse(error.message);
    } catch {
      parsedError = { status: 500, message: error.message || "서버 오류가 발생했습니다." };
    }

    const status = parsedError?.status || 500;
    let message = parsedError?.message || "서버 오류가 발생했습니다.";

    return NextResponse.json({ success: false, message }, { status });
  }
};
