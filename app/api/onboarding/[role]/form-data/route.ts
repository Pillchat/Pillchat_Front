import { NextRequest, NextResponse } from "next/server";
import { serverFetch } from "@/lib/functions";

type RouteContext = {
  params: {
    role: string;
  };
};

export async function GET(
  request: NextRequest,
  context: RouteContext,
) {
  try {
    const { role } = context.params;

    const data = await serverFetch(`/api/onboarding/${role}/form-data`, {
      method: "GET",
      request,
    });

    return NextResponse.json(data);
  } catch (error) {
    let errorInfo: { message?: string; status?: number } = {};

    try {
      errorInfo = JSON.parse(
        error instanceof Error ? error.message : "{}",
      );
    } catch {
      errorInfo = {};
    }

    return NextResponse.json(
      { message: errorInfo.message || "Onboarding API 에러" },
      { status: errorInfo.status || 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: RouteContext,
) {
  try {
    const { role } = context.params;
    const body = await request.json();

    const data = await serverFetch(`/api/onboarding/${role}`, {
      method: "PUT",
      data: body,
      request,
    });

    return NextResponse.json(data);
  } catch (error) {
    let errorInfo: { message?: string; status?: number } = {};

    try {
      errorInfo = JSON.parse(
        error instanceof Error ? error.message : "{}",
      );
    } catch {
      errorInfo = {};
    }

    return NextResponse.json(
      { message: errorInfo.message || "Onboarding API 에러" },
      { status: errorInfo.status || 500 },
    );
  }
}
