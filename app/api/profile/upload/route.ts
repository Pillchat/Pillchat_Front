import { NextRequest } from "next/server";
import { proxyToBackend } from "@/lib/server/proxyMultipart";

export async function PUT(request: NextRequest) {
  return proxyToBackend(request, "/api/profile/upload", "PUT");
}
