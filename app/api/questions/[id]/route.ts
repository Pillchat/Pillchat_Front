import { NextRequest, NextResponse } from "next/server";
import { serverFetch } from "@/lib/functions";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { id } = await params;
    const data = await serverFetch(`/api/questions/${id}`, {
      method: "GET",
      request,
    });

    return NextResponse.json(data);
  } catch (error: unknown | Error) {
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
  { params }: { params: { id: string } },
) {
  try {
    const { id } = params;
    const body = await request.json();

    const data = await serverFetch(`/api/questions/${id}`, {
      method: "PUT",
      data: body,
      request,
    });

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
  { params }: { params: { id: string } },
) {
  try {
    const { id } = params;

    const data = await serverFetch(`/api/questions/${id}`, {
      method: "DELETE",
      request,
    });

    return NextResponse.json(data);
  } catch (error: unknown | Error) {
    console.error("질문 삭제 API 에러:", error);

    const errorMessage = error instanceof Error ? error.message : "{}";
    const errorInfo = JSON.parse(errorMessage);

    return NextResponse.json(
      { message: errorInfo.message || "질문 삭제에 실패했습니다." },
      { status: errorInfo.status || 500 },
    );
  }
}
