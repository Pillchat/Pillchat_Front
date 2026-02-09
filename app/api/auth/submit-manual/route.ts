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
    // 전문가용 필드
    licenseNumber,
    issueDate,
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

  // 2. documentType에 따른 세부 필드 검증
  if (documentType === "student") {
    if (!studentId || !university) {
      return NextResponse.json(
        { error: "학생 회원은 학번과 대학교명이 필수입니다." },
        { status: 400 },
      );
    }
  } else if (documentType === "professional") {
    if (!licenseNumber) {
      return NextResponse.json(
        { error: "전문가 회원은 면허번호가 필수입니다." },
        { status: 400 },
      );
    }
  } else {
    return NextResponse.json(
      { error: "유효하지 않은 사용자 유형입니다." },
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
          ...(documentType === "student"
            ? { studentId, university, department, grade }
            : { licenseNumber, issueDate }),
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
