import { NextRequest } from "next/server";

import { proxyToBackend } from "@/lib/server/proxyMultipart";

type RouteParams = Promise<{ id: string }>;

export async function GET(
  request: NextRequest,
  { params }: { params: RouteParams },
) {
  const { id } = await params;
  return proxyToBackend(request, `/api/flashcards/${id}`, "GET");
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: RouteParams },
) {
  const { id } = await params;
  return proxyToBackend(request, `/api/flashcards/${id}`, "DELETE");
}
