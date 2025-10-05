import { serverFetch } from "@/lib/functions";
import { NextRequest, NextResponse } from "next/server";

export const PUT = async (
  request: NextRequest,
  context: { params: Promise<{ role: string }> },
) => {
  try {
    const { role } = await context.params;
    const body = await request.json();

    const url = `/api/onboarding/${role}`;

    const data = await serverFetch(url, {
      method: "PUT",
      data: body,
      request,
    });

    return NextResponse.json(data);
  } catch (error) {
    const errorInfo = JSON.parse(error instanceof Error ? error.message : "{}");
    return NextResponse.json(
      { message: errorInfo.message || "Onboarding API 에러" },
      { status: errorInfo.status || 500 },
    );
  }
};

export const GET = async (
  request: NextRequest,
  context: { params: Promise<{ role: string }> },
) => {
  try {
    const { role } = await context.params;
    const data = await serverFetch(`/api/onboarding/${role}`, {
      method: "GET",
      request,
    });

    return NextResponse.json(data);
  } catch (error) {
    const errorInfo = JSON.parse(error instanceof Error ? error.message : "{}");

    return NextResponse.json(
      { message: errorInfo.message || "Onboarding API 에러" },
      { status: errorInfo.status || 500 },
    );
  }
};
