import { NextRequest } from "next/server";

import { proxyToBackend } from "@/lib/server/proxyMultipart";

export async function GET(request: NextRequest) {
  return proxyToBackend(
    request,
    `/api/flashcards${request.nextUrl.search}`,
    "GET",
  );
}

export async function POST(request: NextRequest) {
  return proxyToBackend(request, "/api/flashcards", "POST");
}
