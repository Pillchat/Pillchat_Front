import { NextResponse, NextRequest } from "next/server";

export const POST = async (request: NextRequest) => {
  const { nickname, password, email, emailVerificationToken, agreeToTerms } =
    await request.json();
  const tempToken = request.headers.get("Temp-Token") || undefined;

  if (!nickname || !password || !email || agreeToTerms !== true) {
    return NextResponse.json(
      { error: "필수 항목이 누락되었거나 약관 동의가 안 되어 있습니다." },
      { status: 400 },
    );
  }

  if (!tempToken) {
    return NextResponse.json(
      { error: "OCR 인증이 필요합니다. (Temp-Token 없음)" },
      { status: 400 },
    );
  }

  if (!emailVerificationToken)
    return NextResponse.json(
      {
        code: "EMAIL_VERIFICATION_REQUIRED",
        message: "이메일 인증을 다시 진행해주세요.",
      },
      { status: 412 },
    );

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_HOST}/api/auth/register`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Temp-Token": tempToken,
        },
        body: JSON.stringify({
          nickname,
          password,
          email,
          emailVerificationToken,
          agreeToTerms,
        }),
      },
    );

    const data = await response.json();
    return NextResponse.json(
      { success: response.ok, data },
      { status: response.status },
    );
  } catch (error) {
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 },
    );
  }
};
