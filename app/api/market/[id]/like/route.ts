import { NextRequest } from "next/server";
import { proxyMarketRequest } from "@/lib/server/marketProxy";

type MarketLikeRouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(
  request: NextRequest,
  { params }: MarketLikeRouteContext,
) {
  const { id } = await params;
  return proxyMarketRequest(
    request,
    `/api/market/${encodeURIComponent(id)}/like`,
  );
}
