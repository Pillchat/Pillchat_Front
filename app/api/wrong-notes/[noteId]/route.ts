import { NextRequest, NextResponse } from "next/server";
import { serverFetch } from "@/lib/functions";
import { getRequestUserId, isOwnedByRequestUser } from "../_auth";

// GET /api/wrong-notes/[noteId] — 오답노트 상세
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ noteId: string }> },
) {
  try {
    const { noteId } = await params;
    const data = await serverFetch(`/api/wrong-notes/${noteId}`, {
      method: "GET",
      request,
    });

    const note = data?.data ?? data;
    if (
      note?.userId != null &&
      !isOwnedByRequestUser(note, getRequestUserId(request))
    ) {
      return NextResponse.json(
        { message: "오답노트를 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("오답노트 상세 조회 에러:", error);
    const errorInfo = JSON.parse(error.message || "{}");
    return NextResponse.json(
      { message: errorInfo.message || "오답노트 조회에 실패했습니다." },
      { status: errorInfo.status || 500 },
    );
  }
}

// PUT /api/wrong-notes/[noteId] — 오답노트 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ noteId: string }> },
) {
  try {
    const { noteId } = await params;
    const body = await request.json();
    const data = await serverFetch(`/api/wrong-notes/${noteId}`, {
      method: "PUT",
      data: body,
      request,
    });

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("오답노트 수정 에러:", error);
    const errorInfo = JSON.parse(error.message || "{}");
    return NextResponse.json(
      { message: errorInfo.message || "오답노트 수정에 실패했습니다." },
      { status: errorInfo.status || 500 },
    );
  }
}

// DELETE /api/wrong-notes/[noteId] — 오답노트 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ noteId: string }> },
) {
  try {
    const { noteId } = await params;
    await serverFetch(`/api/wrong-notes/${noteId}`, {
      method: "DELETE",
      request,
    });

    return new NextResponse(null, { status: 204 });
  } catch (error: any) {
    console.error("오답노트 삭제 에러:", error);
    const errorInfo = JSON.parse(error.message || "{}");
    return NextResponse.json(
      { message: errorInfo.message || "오답노트 삭제에 실패했습니다." },
      { status: errorInfo.status || 500 },
    );
  }
}
