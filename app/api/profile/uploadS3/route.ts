import { buildQueryParams, serverFetch } from "@/lib/functions";
import { NextRequest, NextResponse } from "next/server";

export const POST = async (request: NextRequest) => {
  try {
    const { filename, type } = await request.json();

    if (!filename || !type) {
      return NextResponse.json(
        { message: "filename과 type은 필수입니다." },
        { status: 400 },
      );
    }

    // serverFetch: Content-Type: application/json 자동 설정 + Auth 헤더 자동 전달
    const data = await serverFetch(
      `/api/files?${buildQueryParams({ files: filename, type })}`,
      {
        method: "POST",
        request,
      },
    );

    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    console.error("uploadS3 에러:", error);
    const errorInfo = JSON.parse(error.message || "{}");
    return NextResponse.json(
      { message: errorInfo.message || "Presigned URL 발급 실패" },
      { status: errorInfo.status || 500 },
    );
  }
};
