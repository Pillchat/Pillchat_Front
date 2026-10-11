import { buildQueryParams } from "@/lib/shared/query";
import { serverFetch } from "@/lib/server/fetch";
import { parseBackendError } from "@/lib/server/apiError";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const files = searchParams.getAll("files");
    const fileSizes = searchParams.getAll("fileSizes");

    if (!type || files.length === 0) {
      return NextResponse.json(
        { error: "type and files are required" },
        { status: 400 },
      );
    }

    const queryString = buildQueryParams({ type, files, fileSizes });

    const data = await serverFetch(`/api/files?${queryString}`, {
      method: "POST",
      request,
    });

    return NextResponse.json(data);
  } catch (error) {
    const { status, message, data } = parseBackendError(error);
    return NextResponse.json({ ...data, message }, { status });
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
    const { status, message, data } = parseBackendError(error);
    return NextResponse.json({ ...data, message }, { status });
  }
}
