import { NextRequest } from "next/server";
import { proxyToBackend } from "@/lib/functions/serverProxyMultipart";

export async function POST(request: NextRequest) {
  return proxyToBackend(request, "/api/boards/upload", "POST");
}
