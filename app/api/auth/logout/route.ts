import { NextRequest, NextResponse } from "next/server";

export const POST = async (request: NextRequest) => {
  try {
    const { email, password } = await request.json();

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_HOST}/api/auth/logout`,
      {
        method: "POST",
        body: JSON.stringify({ username: email, password }),
        headers: {
          "Content-Type": " application/json",
        },
      },
    );

    const data = await response?.json();

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          message: data.message || "로그아웃에 실패했습니다.",
        },
        { status: response.status },
      );
    }
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
