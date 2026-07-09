import { NextRequest } from "next/server";

import { proxyToBackend } from "@/lib/server/proxyMultipart";

export async function GET(request: NextRequest) {
  return proxyToBackend(request, "/api/flashcards/stats", "GET");
}
