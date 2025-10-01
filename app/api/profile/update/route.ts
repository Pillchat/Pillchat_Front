import { NextRequest, NextResponse } from "next/server";

export const PUT = async (request: NextRequest) => {
  try {
    // 클라이언트에서 넘어온 body 파싱
    const { accessToken, tempNickname, keys } = await request.json();

    // 외부 API 호출
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_HOST}/api/profile`, {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        nickname: tempNickname.trim(),
        keys: keys,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { message: data.message || "프로필 편집 실패" },
        { status: response.status }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    console.error("API Route 에러:", error);
    return NextResponse.json({ message: "서버 오류 발생" }, { status: 500 });
  }
};
