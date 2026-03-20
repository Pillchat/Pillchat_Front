import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_HOST;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const accessToken = request.headers
      .get("authorization")
      ?.replace("Bearer ", "");

    const response = await fetch(`${API_BASE_URL}/api/materials/${id}`, {
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
      data = text ? JSON.parse(text) : null;
    } catch {
      data = text;
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("학습자료 상세 조회 API 에러:", error);

    return NextResponse.json(
      { message: "학습자료 상세 정보를 불러오는 데 실패했습니다." },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const accessToken = request.headers
      .get("authorization")
      ?.replace("Bearer ", "");

    if (!accessToken) {
      return NextResponse.json(
        { message: "인증 토큰이 필요합니다." },
        { status: 401 },
      );
    }

    const body = await request.json();

    const response = await fetch(`${API_BASE_URL}/api/materials/${id}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const text = await response.text();

    if (!response.ok) {
      let errorData;
      try {
        errorData = JSON.parse(text);
      } catch {
        errorData = { message: text || "학습자료 수정에 실패했습니다." };
      }
      return NextResponse.json(errorData, { status: response.status });
    }

    if (!text.trim()) {
      return NextResponse.json(
        { success: true, message: "학습자료가 수정되었습니다." },
        { status: 200 },
      );
    }

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { success: true, message: text };
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("학습자료 수정 API 에러:", error);

    return NextResponse.json(
      { message: "학습자료 수정에 실패했습니다." },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const accessToken = request.headers
      .get("authorization")
      ?.replace("Bearer ", "");

    if (!accessToken) {
      return NextResponse.json(
        { message: "인증 토큰이 필요합니다." },
        { status: 401 },
      );
    }

    const response = await fetch(`${API_BASE_URL}/api/materials/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const text = await response.text();

    if (!response.ok) {
      let errorData;
      try {
        errorData = JSON.parse(text);
      } catch {
        errorData = { message: text || "학습자료 삭제에 실패했습니다." };
      }
      return NextResponse.json(errorData, { status: response.status });
    }

    if (!text.trim()) {
      return NextResponse.json(
        { success: true, message: "학습자료가 삭제되었습니다." },
        { status: 200 },
      );
    }

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { success: true, message: text };
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("학습자료 삭제 API 에러:", error);

    return NextResponse.json(
      { message: "학습자료 삭제에 실패했습니다." },
      { status: 500 },
    );
  }
}
