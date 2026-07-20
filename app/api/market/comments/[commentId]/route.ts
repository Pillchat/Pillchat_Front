import { NextRequest } from "next/server";
import { proxyMarketRequest } from "@/lib/server/marketProxy";

type MarketCommentRouteContext = {
  params: Promise<{ commentId: string }>;
};

const getBackendPath = async ({ params }: MarketCommentRouteContext) => {
  const { commentId } = await params;
  return `/api/market/comments/${encodeURIComponent(commentId)}`;
};

export async function PUT(
  request: NextRequest,
  context: MarketCommentRouteContext,
) {
  return proxyMarketRequest(request, await getBackendPath(context));
}

export async function DELETE(
  request: NextRequest,
  context: MarketCommentRouteContext,
) {
  return proxyMarketRequest(request, await getBackendPath(context));
}
