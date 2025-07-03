import { NextRequest, NextResponse } from "next/server";

export const POST = async (request: NextRequest) => {
  try {
    const { email, password } = await request.json();

    // 백엔드 API 호출
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_HOST}/api/auth/login`,
      {
        method: "POST",
        body: JSON.stringify({ username: email, password }),
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    const data = await response?.json();

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          message: data.message || "로그인에 실패했습니다.",
        },
        { status: response.status },
      );
    }

    // 성공 응답
    return NextResponse.json({
      success: true,
      data: {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "서버 오류가 발생했습니다.",
      },
      { status: 500 },
    );
  }
};
