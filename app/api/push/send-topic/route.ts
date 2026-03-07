import { NextRequest, NextResponse } from "next/server";

const NACHOCODE_API_URL = process.env.NACHOCODE_API_URL || "";
const API_KEY = process.env.NACHOCODE_API_KEY || "";
const SECRET_KEY = process.env.NACHOCODE_SECRET_KEY || "";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { topicName, title, content, linkURL, imageURL } = body;

    if (!topicName || !title || !content) {
      return NextResponse.json(
        { message: "topicName, title, content는 필수입니다." },
        { status: 400 },
      );
    }

    const payload: Record<string, any> = {
      topicName,
      title,
      content,
    };

    if (linkURL) payload.linkURL = linkURL;
    if (imageURL) payload.imageURL = imageURL;

    const response = await fetch(`${NACHOCODE_API_URL}/api/push/v2/topic`, {
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
        { message: errorData.message || "토픽 푸시 발송 실패" },
        { status: response.status },
      );
    }

    const data = await response.json().catch(() => ({ message: "Success" }));
    return NextResponse.json(data);
  } catch (error) {
    console.error("토픽 푸시 발송 API 에러:", error);
    return NextResponse.json(
      { message: "토픽 푸시 발송 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
