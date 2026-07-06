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
    "카카오 로그인에 실패했습니다."
  );
};

const pickValue = (data: any, keys: string[]) => {
  for (const source of [data, data?.data]) {
    for (const key of keys) {
      const value = source?.[key];
      if (value !== undefined && value !== null && value !== "") return value;
    }
  }

  return undefined;
};

const pickBoolean = (data: any, keys: string[]) => {
  const value = pickValue(data, keys);

  if (typeof value === "boolean") return value;
  if (typeof value === "string") return value.toLowerCase() === "true";

  return undefined;
};

export const POST = async (request: NextRequest) => {
  try {
    const { code, redirectUri } = await request.json();

    if (!code || typeof code !== "string") {
      return NextResponse.json(
        {
          success: false,
          message: "카카오 인증 코드가 없습니다.",
        },
        { status: 400 },
      );
    }

    if (!redirectUri || typeof redirectUri !== "string") {
      return NextResponse.json(
        {
          success: false,
          message: "카카오 Redirect URI가 없습니다.",
        },
        { status: 400 },
      );
    }

    const apiHost = process.env.NEXT_PUBLIC_API_HOST;
    const kakaoOAuthPath =
      process.env.KAKAO_OAUTH_BACKEND_PATH ?? "/api/auth/oauth/kakao";

    if (!apiHost) {
      return NextResponse.json(
        {
          success: false,
          message: "API host가 설정되지 않았습니다.",
        },
        { status: 500 },
      );
    }

    const response = await fetch(`${apiHost}${kakaoOAuthPath}`, {
      method: "POST",
      body: JSON.stringify({ code, redirectUri }),
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
    const oauthSignupToken = pickToken(data, [
      "oauth_signup_token",
      "oauthSignupToken",
      "signup_token",
      "signupToken",
      "registration_token",
      "registrationToken",
      "temporary_token",
      "temporaryToken",
      "temp_token",
      "tempToken",
    ]);
    const requiresOnboarding =
      pickBoolean(data, [
        "requires_onboarding",
        "requiresOnboarding",
        "need_onboarding",
        "needsOnboarding",
        "new_user",
        "newUser",
        "isNewUser",
      ]) ?? Boolean(oauthSignupToken);

    if (requiresOnboarding) {
      if (!oauthSignupToken) {
        return NextResponse.json(
          {
            success: false,
            message: "카카오 OAuth 임시 가입 토큰이 없습니다.",
          },
          { status: 502 },
        );
      }

      return NextResponse.json({
        success: true,
        data: {
          ...(data?.data ?? data ?? {}),
          requires_onboarding: true,
          oauth_signup_token: oauthSignupToken,
          provider: pickValue(data, ["provider"]) ?? "kakao",
          email: pickValue(data, ["email", "oauthEmail"]),
          name: pickValue(data, ["name", "realName", "username", "oauthName"]),
        },
      });
    }

    if (!accessToken || !refreshToken) {
      return NextResponse.json(
        {
          success: false,
          message: "카카오 로그인 응답에 토큰 데이터가 없습니다.",
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
