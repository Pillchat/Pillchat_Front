import { serverFetch } from "@/lib/functions";
import { NextRequest, NextResponse } from "next/server";

export const GET = async (
  request: NextRequest,
  { params }: { params: { role: string } },
) => {
  try {
    const { role } = params;

    const data = await serverFetch(`/api/onboarding/${role}/form-data`, {
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

export const PUT = async (
  request: NextRequest,
  { params }: { params: { role: string } },
) => {
  try {
    const { role } = params;
    const body = await request.json();

    const data = await serverFetch(`/api/onboarding/${role}`, {
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
