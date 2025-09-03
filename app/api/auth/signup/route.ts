import { NextResponse, NextRequest } from "next/server";
import { SignupFormData } from "@/app/(auth)/signup/page";

export const POST = async (request: NextRequest) => {
  const { nickname, password } = (await request.json()) as SignupFormData;

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_HOST}/api/auth/register`,
      {
        method: "POST",
        body: JSON.stringify({ nickname, password }),
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.ok) {
      const data = await response.json();
      return NextResponse.json(
        { error: data.reason || "회원가입에 실패하였습니다" },
        { status: response.status },
      );
    }

    return NextResponse.json({ message: "success" }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 },
    );
  }
};
