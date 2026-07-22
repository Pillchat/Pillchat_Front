import { serverFetch } from "@/lib/server/fetch";
import { NextRequest, NextResponse } from "next/server";

const getErrorInfo = (error: unknown) => {
  if (!(error instanceof Error)) return {};

  try {
    return JSON.parse(error.message) as { message?: string; status?: number };
  } catch {
    return { message: error.message };
  }
};

export async function GET(request: NextRequest) {
  try {
    const data = await serverFetch("/api/archive/my-badge", {
      method: "GET",
      request,
    });

    return NextResponse.json(data ?? {});
  } catch (error) {
    console.error("Failed to load my badge:", error);
    const errorInfo = getErrorInfo(error);

    return NextResponse.json(
      { message: errorInfo.message || "Failed to load my badge." },
      { status: errorInfo.status || 500 },
    );
  }
}
