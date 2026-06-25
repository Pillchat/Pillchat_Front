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

const readResponseBody = async (response: Response) => {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
};

const pickMessage = (data: any, fallback: string) => {
  for (const key of ["message", "detail", "title", "error"]) {
    const message = data?.[key];
    if (typeof message === "string" && message) return message;
  }

  return fallback;
};

export const POST = async (request: NextRequest) => {
  try {
    const { email, password } = await request.json();
    const apiHost = process.env.NEXT_PUBLIC_API_HOST;

    if (!apiHost) {
      return NextResponse.json(
        {
          success: false,
          message: "API 서버 주소가 설정되지 않았습니다.",
        },
        { status: 500 },
      );
    }

    const response = await fetch(`${apiHost}/api/auth/login`, {
      method: "POST",
      body: JSON.stringify({ email, password }),
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await readResponseBody(response);

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          message: pickMessage(data, "로그인에 실패했습니다."),
        },
        { status: response.status },
      );
    }

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
    console.error("Login API proxy error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "로그인 서버 요청에 실패했습니다.",
      },
      { status: 502 },
    );
  }
};
