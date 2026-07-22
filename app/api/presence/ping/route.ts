import { NextRequest, NextResponse } from "next/server";

import { serverFetch } from "@/lib/server/fetch";

const getErrorInfo = (error: unknown) => {
  if (!(error instanceof Error)) return {};

  try {
    return JSON.parse(error.message) as { message?: string; status?: number };
  } catch {
    return { message: error.message };
  }
};

export async function POST(request: NextRequest) {
  try {
    const data = await serverFetch("/api/presence/ping", {
      method: "POST",
      request,
    });
    const response = NextResponse.json(data ?? {});
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch (error) {
    const errorInfo = getErrorInfo(error);

    return NextResponse.json(
      { message: errorInfo.message || "Failed to update presence." },
      { status: errorInfo.status || 500 },
    );
  }
}
