import { NextResponse, NextRequest } from "next/server";

export const POST = async (request: NextRequest) => {
  const body = await request.json();
  const {
    nickname,
    password,
    email,
    agreeToTerms,
    realName,
    documentType,
    // 학생용 필드
    studentId,
    university,
    department,
    grade,
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

  if (!studentId || !grade) {
    return NextResponse.json(
      { error: "학생 회원은 학번과 학년이 필수입니다." },
      { status: 400 },
    );
  }

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
          agreeToTerms,
          realName,
          documentType,
          studentId,
          university,
          department,
          grade,
        }),
      },
    );

    const data = await response.json();

    // 백엔드 에러 응답 처리
    if (!response.ok) {
      return NextResponse.json(
        { error: data.message || "회원가입 요청 실패" },
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
