import { NextRequest } from "next/server";
import { proxyMarketRequest } from "@/lib/server/marketProxy";

type MarketSellerRouteContext = {
  params: Promise<{ sellerId: string }>;
};

export async function GET(
  request: NextRequest,
  { params }: MarketSellerRouteContext,
) {
  const { sellerId } = await params;
  return proxyMarketRequest(
    request,
    `/api/market/sellers/${encodeURIComponent(sellerId)}`,
  );
}
