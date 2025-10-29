import { buildQueryParams, serverFetch } from "@/lib/functions";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const questionId = searchParams.get("questionId");
    const page = searchParams.get("page") ?? "0";
    const size = searchParams.get("size") ?? "10";

    if (!questionId) {
      return NextResponse.json(
        { error: "questionId is required" },
        { status: 400 },
      );
    }

    const queryString = buildQueryParams({ questionId, page, size });
    const data = await serverFetch(`/api/answers/cards?${queryString}`, {
      method: "GET",
      request,
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching answer cards:", error);
    return NextResponse.json(
      { error: "Failed to fetch answer cards" },
      { status: 500 },
    );
  }
}
