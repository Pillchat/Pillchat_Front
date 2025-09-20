import { NextRequest, NextResponse } from "next/server";
import { getToken } from "@/lib/functions";

export const GET = async (request: NextRequest) => {
  const token = getToken();

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_HOST}/api/profile/me`,
      {
        method: "GET",
        headers: {
          Authorization: `Berear: ${token}`,
        },
      },
    );

    const data = await response?.json();

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          message: data.message || "token을 불러오지 못했습니다.",
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
