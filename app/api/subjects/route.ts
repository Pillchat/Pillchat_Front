import { serverFetch } from "@/lib/functions";
import { NextRequest, NextResponse } from "next/server";

export const GET = async (request: NextRequest) => {
  try {
    const data = await serverFetch(`/api/subjects`, {
      method: "GET",
      request,
    });

    return NextResponse.json(data);
  } catch (error) {
    const errorInfo = JSON.parse(error instanceof Error ? error.message : "{}");

    return NextResponse.json(
      { message: errorInfo.message || "Subjects API 에러" },
      { status: errorInfo.status || 500 },
    );
  }
};
