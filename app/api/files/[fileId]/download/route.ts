import { NextRequest } from "next/server";
import { proxyToBackend } from "@/lib/functions/serverProxyMultipart";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> },
) {
  const { fileId } = await params;
  return proxyToBackend(request, `/api/files/${fileId}/download`, "GET");
}
