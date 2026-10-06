import { NextRequest, NextResponse } from "next/server";
import { isSignupGrade, isSignupSource } from "@/constants/signup";
import { serverFetch } from "@/lib/server/fetch";

const endpoint = "/api/profile/personal-info";

function errorResponse(error: unknown) {
  let details: { status?: number; message?: string } = {};
  if (error instanceof Error) {
    try {
      details = JSON.parse(error.message);
    } catch {
      details.message = error.message;
    }
  }
  return NextResponse.json(
    { message: details.message || "맞춤형 정보를 처리하지 못했습니다." },
    { status: details.status || 500 },
  );
}

export async function GET(request: NextRequest) {
  try {
    const data = await serverFetch(endpoint, { method: "GET", request });
    return NextResponse.json(data);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PUT(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { message: "입력 정보를 확인해주세요." },
      { status: 400 },
    );
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json(
      { message: "입력 정보를 확인해주세요." },
      { status: 400 },
    );
  }

  const values = body as Record<string, unknown>;
  const realName =
    typeof values.realName === "string" ? values.realName.trim() : "";
  const nickname =
    typeof values.nickname === "string" ? values.nickname.trim() : "";
  const university =
    typeof values.university === "string" ? values.university.trim() : "";

  if (!realName || realName.length > 50) {
    return NextResponse.json(
      { message: "실명은 1~50자로 입력해주세요." },
      { status: 400 },
    );
  }
  if (!/^[가-힣A-Za-z0-9]{2,50}$/.test(nickname)) {
    return NextResponse.json(
      { message: "닉네임은 한글, 영문, 숫자로 2~50자 입력해주세요." },
      { status: 400 },
    );
  }
  if (!isSignupGrade(values.grade) || !isSignupSource(values.signupSource)) {
    return NextResponse.json(
      { message: "학년과 가입 경로를 선택해주세요." },
      { status: 400 },
    );
  }
  if (
    (values.university != null && typeof values.university !== "string") ||
    university.length > 255
  ) {
    return NextResponse.json(
      { message: "학교명은 255자 이하로 입력해주세요." },
      { status: 400 },
    );
  }

  try {
    const data = await serverFetch(endpoint, {
      method: "PUT",
      request,
      data: {
        realName,
        nickname,
        grade: values.grade,
        university,
        signupSource: values.signupSource,
      },
    });
    return NextResponse.json(data);
  } catch (error) {
    return errorResponse(error);
  }
}
