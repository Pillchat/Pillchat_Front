import { NextRequest, NextResponse } from "next/server";
import { buildQueryParams } from "@/lib/shared/query";
import { serverFetch } from "@/lib/server/fetch";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_HOST;
const BOARD_CATEGORIES = ["FREE", "TIP", "REVIEW"];
const normalizeToken = (token: string) => token.replace(/^Bearer\s+/i, "");

const getAuthHeaders = (accessToken?: string): HeadersInit =>
  accessToken
    ? {
        Authorization: `Bearer ${normalizeToken(accessToken)}`,
      }
    : {};

const parseBackendResponse = async (response: Response) => {
  const text = await response.text();

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};

const getPageItems = (data: any) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.content)) return data.content;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.data?.content)) return data.data.content;
  return [];
};

const getErrorBody = (data: any, status: number) => {
  if (data && typeof data === "object") return data;
  if (typeof data === "string" && data.trim()) {
    return { message: data };
  }
  return { message: `게시글 목록 조회에 실패했습니다. (${status})` };
};

const appendListParams = (
  url: URL,
  searchParams: URLSearchParams,
  category: string,
) => {
  searchParams.forEach((value, key) => {
    if (key === "category" || key === "status") return;

    if (key === "sort") {
      if (category === "TIP" && (value === "latest" || value === "popular")) {
        url.searchParams.set(key, value);
      }
      return;
    }

    url.searchParams.append(key, value);
  });

  if (!url.searchParams.has("sort") && category === "TIP") {
    const status = searchParams.get("status");
    if (status === "popular" || status === "best") {
      url.searchParams.set("sort", "popular");
    } else if (status === "latest") {
      url.searchParams.set("sort", "latest");
    }
  }
};

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
    const accessToken =
      request.headers.get("authorization")?.replace("Bearer ", "") ||
      request.cookies.get("access_token")?.value;
    const category = request.nextUrl.searchParams.get("category");
    const categories = category ? [category.toUpperCase()] : BOARD_CATEGORIES;

    if (!accessToken) {
      return NextResponse.json(
        { message: "로그인이 필요합니다." },
        { status: 401 },
      );
    }

    const responses = await Promise.all(
      categories.map(async (item) => {
        const backendUrl = new URL(
          `${API_BASE_URL}/api/boards/category/${item}`,
        );
        appendListParams(backendUrl, request.nextUrl.searchParams, item);

        const response = await fetch(backendUrl.toString(), {
          method: "GET",
          headers: getAuthHeaders(accessToken),
          cache: "no-store",
        });
        const data = await parseBackendResponse(response);

        return { category: item, response, data };
      }),
    );

    if (category) {
      const failed = responses.find(({ response }) => !response.ok);
      if (failed) {
        return NextResponse.json(
          getErrorBody(failed.data, failed.response.status),
          { status: failed.response.status },
        );
      }
    }

    const successful = responses.filter(({ response }) => response.ok);

    if (successful.length === 0) {
      const failed = responses[0];
      return NextResponse.json(
        getErrorBody(failed?.data, failed?.response.status ?? 500),
        { status: failed?.response.status ?? 500 },
      );
    }

    const data = successful.flatMap(({ data }) => getPageItems(data));

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("게시글 목록 조회 API 에러:", error);

    return NextResponse.json(
      { message: "게시글 목록을 불러오는 데 실패했습니다." },
      { status: 500 },
    );
  }
}
