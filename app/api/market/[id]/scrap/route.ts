import { NextRequest } from "next/server";
import { proxyMarketRequest } from "@/lib/server/marketProxy";

type MarketScrapRouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(
  request: NextRequest,
  { params }: MarketScrapRouteContext,
) {
  const { id } = await params;
  return proxyMarketRequest(
    request,
    `/api/market/${encodeURIComponent(id)}/scrap`,
  );
}
