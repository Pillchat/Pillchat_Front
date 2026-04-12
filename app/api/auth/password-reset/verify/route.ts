import { NextRequest, NextResponse } from "next/server";

export const POST = async (request: NextRequest) => {
  try {
    const { email, code } = await request.json();

    if (!email || !code) {
      return NextResponse.json(
        {
          success: false,
          message: "이메일과 인증번호를 입력해주세요.",
        },
        { status: 400 },
      );
    }

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_HOST}/api/auth/password-reset/verify`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, code }),
      },
    );

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          message:
            data?.message ||
            data?.reason ||
            "인증번호 확인에 실패했습니다.",
        },
        { status: response.status },
      );
    }

    return NextResponse.json({
      success: true,
      message: data?.message || "인증이 완료되었습니다.",
      data,
    });
  } catch (error) {
    console.error("Password reset verify proxy error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "서버 오류가 발생했습니다.",
      },
      { status: 500 },
    );
  }
};
