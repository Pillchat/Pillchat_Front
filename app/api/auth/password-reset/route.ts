import { NextRequest, NextResponse } from "next/server";

export const POST = async (request: NextRequest) => {
  try {
    const { email, newPassword } = await request.json();

    if (!email) {
      return NextResponse.json(
        {
          success: false,
          message: "이메일을 입력해주세요.",
        },
        { status: 400 },
      );
    }

    if (!newPassword) {
      return NextResponse.json(
        {
          success: false,
          message: "새 비밀번호를 입력해주세요.",
        },
        { status: 400 },
      );
    }

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_HOST}/api/auth/password-reset`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, newPassword }),
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
            "비밀번호 재설정에 실패했습니다.",
        },
        { status: response.status },
      );
    }

    return NextResponse.json({
      success: true,
      message: data?.message || "비밀번호가 재설정되었습니다.",
      data,
    });
  } catch (error) {
    console.error("Password reset proxy error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "서버 오류가 발생했습니다.",
      },
      { status: 500 },
    );
  }
};
