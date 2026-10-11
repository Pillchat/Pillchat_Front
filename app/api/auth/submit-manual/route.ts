import { NextResponse, NextRequest } from "next/server";
import { isSignupGrade, isSignupSource } from "@/constants/signup";

export const POST = async (request: NextRequest) => {
  const body = await request.json();
  const {
    nickname,
    password,
    email,
    emailVerificationToken,
    agreeToTerms,
    realName,
    documentType,
    university,
    grade,
    signupSource,
  } = body;

  // 1. 공통 필수 필드 검증
  if (
    !nickname ||
    !password ||
    !email ||
    agreeToTerms !== true ||
    !realName ||
    !documentType
  ) {
    return NextResponse.json(
      { error: "필수 기본 정보가 누락되었거나 약관 동의가 안 되어 있습니다." },
      { status: 400 },
    );
  }

  if (documentType !== "student") {
    return NextResponse.json(
      { error: "현재 일반 회원가입은 학생 회원만 지원합니다." },
      { status: 400 },
    );
  }

  if (!isSignupGrade(grade)) {
    return NextResponse.json(
      { error: "학년 또는 상태를 선택해주세요." },
      { status: 400 },
    );
  }

  if (!isSignupSource(signupSource)) {
    return NextResponse.json(
      { error: "가입 경로를 선택해주세요." },
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
    // 3. 백엔드 API 호출 (Temp-Token 헤더 제거)
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_HOST}/api/auth/register-manual`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // 수동 가입은 Temp-Token 불필요
        },
        body: JSON.stringify({
          nickname,
          password,
          email,
          emailVerificationToken,
          agreeToTerms,
          realName,
          documentType,
          university,
          grade,
          signupSource,
        }),
      },
    );

    const data = await response.json();

    // 백엔드 에러 응답 처리
    if (!response.ok) {
      return NextResponse.json(
        { ...data, message: data.message || "회원가입 요청 실패" },
        { status: response.status },
      );
    }

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error) {
    console.error("Manual Register Error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 },
    );
  }
};
