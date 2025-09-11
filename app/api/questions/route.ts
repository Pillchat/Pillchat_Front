import { NextRequest, NextResponse } from "next/server";
import { QuestionCreateRequest } from "@/types/question";
import { serverFetch } from "@/lib/functions";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_HOST;

export async function POST(request: NextRequest) {
  try {
    const { title, content, subjectId, images }: QuestionCreateRequest =
      await request.json();

    const headers: Record<string, string> = {
      "Content-Type": "multipart/form-data",
    };

    const formData = new FormData();
    formData.append("title", title);
    formData.append("content", content);
    formData.append("subjectId", subjectId);

    // Append each image individually
    if (images && images.length > 0) {
      images.forEach((image) => {
        formData.append("images", image);
      });
    }

    if (request) {
      const authorization = request.headers.get("authorization");
      if (authorization) {
        headers["Authorization"] = authorization;
      }
    }

    const data = await fetch(API_BASE_URL + "/api/questions", {
      method: "POST",
      headers,
      body: formData,
    });

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
