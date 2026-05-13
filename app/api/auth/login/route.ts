import { NextRequest, NextResponse } from "next/server";

const pickToken = (data: any, keys: string[]) => {
  for (const source of [data, data?.data]) {
    for (const key of keys) {
      const token = source?.[key];
      if (typeof token === "string" && token) return token;
    }
  }

  return undefined;
};

export const POST = async (request: NextRequest) => {
  try {
    const { email, password } = await request.json();

    // 백엔드 API 호출
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_HOST}/api/auth/login`,
      {
        method: "POST",
        body: JSON.stringify({ email, password }),
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
        access_token: pickToken(data, [
          "access_token",
          "accessToken",
          "access",
        ]),
        refresh_token: pickToken(data, [
          "refresh_token",
          "refreshToken",
          "refresh",
        ]),
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
