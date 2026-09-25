import { NextRequest, NextResponse } from "next/server";
import { serverFetch } from "@/lib/server/fetch";

export const POST = async (request: NextRequest) => {
  try {
    const data = await serverFetch("/api/auth/logout", {
      method: "POST",
      request,
    });

    const response = NextResponse.json(
      { success: true, data },
      { status: 200 },
    );
    response.cookies.delete("access_token");

    return response;
  } catch (error: any) {
    let parsedError;
    try {
      parsedError = JSON.parse(error.message);
      console.log(parsedError);
    } catch {
      parsedError = {
        status: 500,
        message: error.message || "서버 오류가 발생했습니다.",
      };
    }

    const status = parsedError?.status || 500;
    let message = parsedError?.message || "서버 오류가 발생했습니다.";

    const response = NextResponse.json({ success: false, message }, { status });
    response.cookies.delete("access_token");

    return response;
  }
};
