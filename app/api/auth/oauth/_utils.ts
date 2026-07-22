import { NextRequest, NextResponse } from "next/server";

type OAuthProvider = "google" | "kakao";

type NativeOAuthProxyParams = {
  request: NextRequest;
  provider: OAuthProvider;
  providerLabel: string;
  backendPath: string;
};

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

const getBackendMessage = (data: any) => {
  for (const source of [data, data?.data]) {
    for (const key of ["message", "error_description", "error"]) {
      const value = source?.[key];
      if (typeof value === "string" && value) return value;
    }
  }

  return undefined;
};

const getErrorMessage = (data: any, providerLabel: string) => {
  const errorCode = getErrorCode(data);

  if (errorCode === "ALREADY_EXIST_EMAIL") {
    return "이미 일반 회원가입으로 가입된 이메일입니다. 기존 계정으로 로그인해주세요.";
  }

  const backendMessage = getBackendMessage(data);
  if (backendMessage) return backendMessage;

  if (errorCode === "INVALID_OAUTH_TOKEN") {
    return `${providerLabel} 로그인 정보가 유효하지 않습니다. 다시 시도해주세요.`;
  }

  if (errorCode === "OAUTH_EMAIL_REQUIRED") {
    return `${providerLabel} 계정의 이메일 제공 동의가 필요합니다.`;
  }

  return errorCode ?? `${providerLabel} 로그인에 실패했습니다.`;
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

const normalizeOAuthSuccessResponse = (
  data: any,
  provider: OAuthProvider,
  providerLabel: string,
) => {
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
          message: `${providerLabel} OAuth 임시 가입 토큰이 없습니다.`,
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
        provider: pickValue(data, ["provider"]) ?? provider,
        email: pickValue(data, ["email", "oauthEmail"]),
        name: pickValue(data, ["name", "realName", "username", "oauthName"]),
      },
    });
  }

  if (!accessToken || !refreshToken) {
    return NextResponse.json(
      {
        success: false,
        message: `${providerLabel} 로그인 응답에 토큰 데이터가 없습니다.`,
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
};

export const handleNativeOAuthProxy = async ({
  request,
  provider,
  providerLabel,
  backendPath,
}: NativeOAuthProxyParams) => {
  try {
    const { token } = await request.json();

    if (!token || typeof token !== "string") {
      return NextResponse.json(
        {
          success: false,
          message: `${providerLabel} 네이티브 인증 토큰이 없습니다.`,
        },
        { status: 400 },
      );
    }

    const apiHost = process.env.NEXT_PUBLIC_API_HOST;

    if (!apiHost) {
      return NextResponse.json(
        {
          success: false,
          message: "API host가 설정되지 않았습니다.",
        },
        { status: 500 },
      );
    }

    const response = await fetch(`${apiHost}${backendPath}`, {
      method: "POST",
      body: JSON.stringify({ token }),
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
          message: getErrorMessage(data, providerLabel),
        },
        { status: response.ok ? 400 : response.status },
      );
    }

    return normalizeOAuthSuccessResponse(data, provider, providerLabel);
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: "서버 오류가 발생했습니다.",
      },
      { status: 500 },
    );
  }
};
