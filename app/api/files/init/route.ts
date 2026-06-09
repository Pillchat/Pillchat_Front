import { NextRequest } from "next/server";
import { proxyToBackend } from "@/lib/server/proxyMultipart";

export async function POST(request: NextRequest) {
  return proxyToBackend(request, "/api/files/init", "POST");
}
