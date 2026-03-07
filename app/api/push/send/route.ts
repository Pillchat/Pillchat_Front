import { NextRequest, NextResponse } from "next/server";

const NACHOCODE_API_URL = process.env.NACHOCODE_API_URL || "";
const API_KEY = process.env.NACHOCODE_API_KEY || "";
const SECRET_KEY = process.env.NACHOCODE_SECRET_KEY || "";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userIds, title, content, linkURL, imageURL } = body;

    if (!userIds || !title || !content) {
      return NextResponse.json(
        { message: "userIds, title, content는 필수입니다." },
        { status: 400 },
      );
    }

    const response = await fetch(`${NACHOCODE_API_URL}/api/push/v2/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": API_KEY,
        "x-secret-key": SECRET_KEY,
      },
      body: JSON.stringify({
        userIds,
        title,
        content,
        linkURL,
        imageURL,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { message: errorData.message || "푸시 발송 실패" },
        { status: response.status },
      );
    }

    const data = await response.text();
    return NextResponse.json({ message: data });
  } catch (error) {
    console.error("개인 푸시 발송 API 에러:", error);
    return NextResponse.json(
      { message: "푸시 발송 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
