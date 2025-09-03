import { NextRequest, NextResponse } from "next/server";

export const DELETE = async (request: NextRequest) => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_HOST}/api/auth/delete`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    const data = await response?.json();

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          message: data.message || "계정탈퇴에 실패했습니다.",
        },
        { status: response.status },
      );
    }
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
