import { NextRequest, NextResponse } from "next/server";
import { buildQueryParams, serverFetch } from "@/lib/functions";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_HOST;

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const title = searchParams.get("title");
    const content = searchParams.get("content");
    const category = searchParams.get("category");
    const keys = searchParams.getAll("keys");

    if (!title || !content || !category) {
      return NextResponse.json(
        { error: "title, content, category are required" },
        { status: 400 },
      );
    }

    const queryString = buildQueryParams({
      title,
      content,
      category,
      keys,
    });

    const data = await serverFetch(`/api/boards?${queryString}`, {
      method: "POST",
      request,
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error creating board:", error);
    return NextResponse.json(
      { error: "Failed to create board" },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const accessToken = request.headers
      .get("authorization")
      ?.replace("Bearer ", "");

    const backendUrl = new URL(`${API_BASE_URL}/api/boards`);

    request.nextUrl.searchParams.forEach((value, key) => {
      backendUrl.searchParams.append(key, value);
    });

    const response = await fetch(backendUrl.toString(), {
      method: "GET",
      headers: accessToken
        ? {
            Authorization: `Bearer ${accessToken}`,
          }
        : {},
      cache: "no-store",
    });

    const text = await response.text();

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error("게시글 목록 조회 API 에러:", error);

    return NextResponse.json(
      { message: "게시글 목록을 불러오는 데 실패했습니다." },
      { status: 500 },
    );
  }
}
