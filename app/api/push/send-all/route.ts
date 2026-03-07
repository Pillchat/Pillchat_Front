import { NextRequest, NextResponse } from "next/server";

const NACHOCODE_API_URL = process.env.NACHOCODE_API_URL || "";
const API_KEY = process.env.NACHOCODE_API_KEY || "";
const SECRET_KEY = process.env.NACHOCODE_SECRET_KEY || "";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, content, linkURL, imageURL, scheduleTime } = body;

    if (!title || !content) {
      return NextResponse.json(
        { message: "title, content는 필수입니다." },
        { status: 400 },
      );
    }

    const payload: Record<string, any> = {
      title,
      content,
    };

    if (linkURL) payload.linkURL = linkURL;
    if (imageURL) payload.imageURL = imageURL;
    if (scheduleTime) {
      payload.options = { scheduleTime };
    }

    const response = await fetch(`${NACHOCODE_API_URL}/api/push/v2/all`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": API_KEY,
        "x-secret-key": SECRET_KEY,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { message: errorData.message || "전체 푸시 발송 실패" },
        { status: response.status },
      );
    }

    const data = await response.json().catch(() => ({ message: "Success" }));
    return NextResponse.json(data);
  } catch (error) {
    console.error("전체 푸시 발송 API 에러:", error);
    return NextResponse.json(
      { message: "전체 푸시 발송 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
