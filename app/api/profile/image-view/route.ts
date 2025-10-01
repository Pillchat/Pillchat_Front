import { NextRequest, NextResponse } from "next/server";

export const GET = async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const keys = searchParams.getAll("keys"); // 여러 key 지원
    const accessToken = request.headers.get("authorization")?.replace("Bearer ", "");

    if (!accessToken) {
      return NextResponse.json({ message: "인증 토큰이 필요합니다." }, { status: 401 });
    }

    // 외부 API 호출
    const query = new URLSearchParams();
    keys.forEach((k) => query.append("keys", k));

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_HOST}/api/files?${query.toString()}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { message: data.message || "파일 조회 실패" },
        { status: response.status }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    console.error("파일 API Route 에러:", error);
    return NextResponse.json({ message: "서버 오류 발생" }, { status: 500 });
  }
};