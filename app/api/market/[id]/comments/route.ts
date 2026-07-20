import { NextRequest } from "next/server";
import { proxyMarketRequest } from "@/lib/server/marketProxy";

type MarketCommentsRouteContext = {
  params: Promise<{ id: string }>;
};

const getBackendPath = async ({ params }: MarketCommentsRouteContext) => {
  const { id } = await params;
  return `/api/market/${encodeURIComponent(id)}/comments`;
};

export async function GET(
  request: NextRequest,
  context: MarketCommentsRouteContext,
) {
  return proxyMarketRequest(request, await getBackendPath(context));
}

export async function POST(
  request: NextRequest,
  context: MarketCommentsRouteContext,
) {
  return proxyMarketRequest(request, await getBackendPath(context));
}
