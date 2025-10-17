import { NextRequest, NextResponse } from "next/server";
import { QuestionCreateRequest, QuestionResponse } from "@/types/question";
import { serverFetch } from "@/lib/functions";
import { filter } from "lodash";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_HOST;

export async function POST(request: NextRequest) {
  try {
    const { title, content, subjectId, keys }: QuestionCreateRequest =
      await request.json();

    const headers: Record<string, string> = {};

    const formData = new FormData();
    formData.append("title", title);
    formData.append("content", content);
    formData.append("subjectId", subjectId);

    // Append each image individually
    if (keys && keys.length > 0) {
      keys.forEach((key) => {
        formData.append("keys", key);
      });
    }

    if (request) {
      const authorization = request.headers.get("authorization");
      if (authorization) {
        headers["Authorization"] = authorization;
      }
    }

    const response = await fetch(API_BASE_URL + "/api/questions", {
      method: "POST",
      headers,
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error("질문 생성 API 에러:", error);

    const errorMessage = error instanceof Error ? error.message : "{}";
    const errorInfo = JSON.parse(errorMessage);

    return NextResponse.json(errorInfo, { status: errorInfo.status || 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const data = await serverFetch("/api/questions", {
      method: "GET",
      request,
    });

    const status = request.nextUrl.searchParams.get("status");

    if (status === "pending") {
      const pendingData = filter(
        data,
        (question: QuestionResponse) => question.answerCount === 0,
      );

      return NextResponse.json(pendingData);
    } else if (status === "completed") {
      const completedData = filter(
        data,
        (question: QuestionResponse) => question.answerCount > 0,
      );
      return NextResponse.json(completedData);
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("질문 목록 조회 API 에러:", error);

    const errorInfo = JSON.parse(error.message || "{}");
    return NextResponse.json(
      { message: errorInfo.message || "질문 목록을 불러오는데 실패했습니다." },
      { status: errorInfo.status || 500 },
    );
  }
}
