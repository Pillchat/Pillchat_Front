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
  try {
    const { searchParams } = new URL(request.url);
    const keys = searchParams.getAll("keys"); // 배열로 keys 파라미터들을 가져옴

    if (!keys || keys.length === 0) {
      return NextResponse.json(
        { error: "keys parameter is required" },
        { status: 400 },
      );
    }

    // buildQueryParams를 사용하여 keys 배열을 쿼리 파라미터로 변환
    const queryString = buildQueryParams({ keys });

    const data = await serverFetch(`/api/files?${queryString}`, {
      method: "GET",
      request,
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching files:", error);
    return NextResponse.json(
      { error: "Failed to fetch files" },
      { status: 500 },
    );
  }
}
