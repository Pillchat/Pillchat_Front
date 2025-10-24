import { NextRequest, NextResponse } from "next/server";
import { serverFetch } from "@/lib/functions";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_HOST;

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const data = await serverFetch(`/api/questions/${id}`, {
      method: "GET",
      request,
    });

    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error("질문 상세 조회 API 에러:", error);

    const errorMessage = error instanceof Error ? error.message : "{}";
    const errorInfo = JSON.parse(errorMessage);
    return NextResponse.json(
      { message: errorInfo.message || "질문을 불러오는데 실패했습니다." },
      { status: errorInfo.status || 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const { title, content, subjectId, keys } = await request.json();

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

    const response = await fetch(API_BASE_URL + `/api/questions/${id}`, {
      method: "PUT",
      headers,
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error("질문 수정 API 에러:", error);

    const errorMessage = error instanceof Error ? error.message : "{}";
    const errorInfo = JSON.parse(errorMessage);
    return NextResponse.json(
      { message: errorInfo.message || "질문 수정에 실패했습니다." },
      { status: errorInfo.status || 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;

    const data = await serverFetch(`/api/questions/${id}`, {
      method: "DELETE",
      request,
    });

    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error("질문 삭제 API 에러:", error);

    const errorMessage = error instanceof Error ? error.message : "{}";
    const errorInfo = JSON.parse(errorMessage);
    return NextResponse.json(
      { message: errorInfo.message || "질문 삭제에 실패했습니다." },
      { status: errorInfo.status || 500 },
    );
  }
}
