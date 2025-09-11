import { buildQueryParams, serverFetch } from "@/lib/functions";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { type, userId, files, questionId } = await request.json();

    if (!type || !userId || !files || !questionId) {
      return NextResponse.json(
        { error: "questionId and files are required" },
        { status: 400 },
      );
    }

    const data = await serverFetch(
      `/api/files?${buildQueryParams({
        type,
        userId,
        files,
        questionId,
      })}`,
      {
        method: "POST",
        request,
      },
    );

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error generating presigned URL:", error);
    return NextResponse.json(
      { error: "Failed to generate presigned URL" },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  const data = await serverFetch("/api/files", {
    method: "GET",
    request,
  });

  return NextResponse.json(data);
}
