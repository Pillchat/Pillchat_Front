import { buildQueryParams, serverFetch } from "@/lib/functions";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const files = searchParams.getAll("files");

    if (!type || files.length === 0) {
      return NextResponse.json(
        { error: "type and files are required" },
        { status: 400 },
      );
    }

    const queryString = buildQueryParams({ type, files });

    const data = await serverFetch(`/api/files?${queryString}`, {
      method: "POST",
      request,
    });

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
    const keys = searchParams.getAll("keys");

    if (keys.length === 0) {
      return NextResponse.json(
        { error: "keys parameter is required" },
        { status: 400 },
      );
    }

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