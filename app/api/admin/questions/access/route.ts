import { NextRequest, NextResponse } from "next/server";
import { serverFetch } from "@/lib/server/fetch";

export async function GET(request: NextRequest) {
  if (
    !request.headers.get("authorization") &&
    !request.cookies.get("access_token")?.value
  ) {
    return NextResponse.json(
      { message: "로그인이 필요합니다." },
      { status: 401 },
    );
  }
  try {
    await serverFetch("/api/admin/dashboard", { method: "GET", request });
    return NextResponse.json({ isAdmin: true });
  } catch (error) {
    let status = 503;
    if (error instanceof Error) {
      try {
        const details = JSON.parse(error.message);
        if (details.status === 401 || details.status === 403)
          status = details.status;
      } catch {
        // Non-JSON errors are treated as an unavailable authorization service.
      }
    }
    return NextResponse.json(
      {
        message:
          status === 401 || status === 403
            ? "관리자 계정만 이용할 수 있습니다."
            : "관리자 권한을 확인하지 못했습니다. 잠시 후 다시 시도해주세요.",
      },
      { status },
    );
  }
}
