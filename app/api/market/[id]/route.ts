import { NextRequest } from "next/server";
import { proxyMarketRequest } from "@/lib/server/marketProxy";

type MarketItemRouteContext = {
  params: Promise<{ id: string }>;
};

const getBackendPath = async ({ params }: MarketItemRouteContext) => {
  const { id } = await params;
  return `/api/market/${encodeURIComponent(id)}`;
};

export async function GET(
  request: NextRequest,
  context: MarketItemRouteContext,
) {
  return proxyMarketRequest(request, await getBackendPath(context));
}

export async function PUT(
  request: NextRequest,
  context: MarketItemRouteContext,
) {
  return proxyMarketRequest(request, await getBackendPath(context));
}

export async function DELETE(
  request: NextRequest,
  context: MarketItemRouteContext,
) {
  return proxyMarketRequest(request, await getBackendPath(context));
}
