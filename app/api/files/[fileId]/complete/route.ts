import { NextRequest } from "next/server";
import { proxyToBackend } from "@/lib/functions/serverProxyMultipart";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> },
) {
  const { fileId } = await params;
  return proxyToBackend(request, `/api/files/${fileId}/complete`, "POST");
}
