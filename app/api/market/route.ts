import { NextRequest } from "next/server";
import { proxyMarketRequest } from "@/lib/server/marketProxy";

export async function GET(request: NextRequest) {
  return proxyMarketRequest(request, "/api/market");
}

export async function POST(request: NextRequest) {
  return proxyMarketRequest(request, "/api/market");
}
