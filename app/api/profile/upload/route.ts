import { NextRequest } from "next/server";
import { proxyToBackend } from "@/lib/functions/serverProxyMultipart";

export async function PUT(request: NextRequest) {
  return proxyToBackend(request, "/api/profile/upload", "PUT");
}
