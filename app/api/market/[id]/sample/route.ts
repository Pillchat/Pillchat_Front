import { NextRequest } from "next/server";
import { proxyMarketRequest } from "@/lib/server/marketProxy";

type MarketSampleRouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(
  request: NextRequest,
  { params }: MarketSampleRouteContext,
) {
  const { id } = await params;
  return proxyMarketRequest(
    request,
    `/api/market/${encodeURIComponent(id)}/sample`,
  );
}
