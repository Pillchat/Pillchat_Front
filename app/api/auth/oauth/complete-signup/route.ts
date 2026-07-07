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

const getErrorCode = (data: any) => {
  for (const source of [data, data?.data]) {
    for (const key of ["code", "error_code", "errorCode"]) {
      const value = source?.[key];
      if (typeof value === "string" && value) return value;
    }
  }

  return undefined;
};

const getErrorMessage = (data: any) => {
  const errorCode = getErrorCode(data);

  if (errorCode === "ALREADY_EXIST_EMAIL") {
    return "이미 일반 회원가입으로 가입된 이메일입니다. 기존 계정으로 로그인해주세요.";
  }

  return (
    data?.message ??
    data?.error_description ??
    data?.error ??
    errorCode ??
    "OAuth 회원가입에 실패했습니다."
  );
};

export const POST = async (request: NextRequest) => {
  try {
    const body = await request.json();

    if (!body?.oauthSignupToken || typeof body.oauthSignupToken !== "string") {
      return NextResponse.json(
        {
          success: false,
          message: "OAuth 임시 가입 토큰이 없습니다.",
        },
        { status: 400 },
      );
    }

    if (body.documentType !== "student") {
      return NextResponse.json(
        {
          success: false,
          message: "학생 회원가입만 가능합니다.",
        },
        { status: 400 },
      );
    }

    const apiHost = process.env.NEXT_PUBLIC_API_HOST;
    const completeSignupPath =
      process.env.OAUTH_COMPLETE_SIGNUP_BACKEND_PATH ??
      "/api/auth/oauth/complete-signup";

    if (!apiHost) {
      return NextResponse.json(
        {
          success: false,
          message: "API host가 설정되지 않았습니다.",
        },
        { status: 500 },
      );
    }

    const response = await fetch(`${apiHost}${completeSignupPath}`, {
      method: "POST",
      body: JSON.stringify(body),
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.json().catch(() => null);

    if (!response.ok || data?.success === false) {
      return NextResponse.json(
        {
          success: false,
          code: getErrorCode(data),
          message: getErrorMessage(data),
        },
        { status: response.ok ? 400 : response.status },
      );
    }

    const accessToken = pickToken(data, [
      "access_token",
      "accessToken",
      "access",
      "token",
      "jwt",
    ]);
    const refreshToken = pickToken(data, [
      "refresh_token",
      "refreshToken",
      "refresh",
    ]);

    if (!accessToken || !refreshToken) {
      return NextResponse.json(
        {
          success: false,
          message: "OAuth 회원가입 응답에 토큰 데이터가 없습니다.",
        },
        { status: 502 },
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        access_token: accessToken,
        refresh_token: refreshToken,
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
