import { serverFetch } from "@/lib/functions";
import { NextRequest, NextResponse } from "next/server";

type RouteParams = Promise<{ commentId: string }>;

export async function POST(
  request: NextRequest,
  { params }: { params: RouteParams },
) {
  try {
    const { commentId } = await params;

    if (!commentId) {
      return NextResponse.json(
        { error: "commentId is required" },
        { status: 400 },
      );
    }

    const data = await serverFetch(`/api/boards/comments/${commentId}/like`, {
      method: "POST",
      request,
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error liking comment:", error);
    return NextResponse.json(
      { error: "Failed to like comment" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: RouteParams },
) {
  try {
    const { commentId } = await params;

    if (!commentId) {
      return NextResponse.json(
        { error: "commentId is required" },
        { status: 400 },
      );
    }

    const data = await serverFetch(`/api/boards/comments/${commentId}/like`, {
      method: "DELETE",
      request,
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error unliking comment:", error);
    return NextResponse.json(
      { error: "Failed to unlike comment" },
      { status: 500 },
    );
  }
}
