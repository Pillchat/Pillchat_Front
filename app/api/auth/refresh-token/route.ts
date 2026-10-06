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
    const { refreshToken } = await request.json();

    // 백엔드 API 호출
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_HOST}/api/auth/refresh-token`,
      {
        method: "POST",
        body: JSON.stringify({ refreshToken }),
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        {
          ...data,
          success: false,
          message: data.message || "토큰 갱신에 실패했습니다.",
        },
        { status: response.status },
      );
    }

    if (
      !pickToken(data, ["access_token", "accessToken", "access"]) ||
      !pickToken(data, ["refresh_token", "refreshToken", "refresh"])
    ) {
      return NextResponse.json(
        {
          code: "INVALID_TOKEN_RESPONSE",
          message: "갱신된 토큰 쌍을 받지 못했습니다.",
        },
        { status: 502 },
      );
    }
    // 성공 응답 - 로그인 API와 동일한 형식으로 통일
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
    console.error("토큰 갱신 API 에러:", error);
    return NextResponse.json(
      {
        success: false,
        message: "서버 오류가 발생했습니다.",
      },
      { status: 500 },
    );
  }
};
