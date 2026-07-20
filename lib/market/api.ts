import { fetchAPI } from "@/lib/client/fetch";
import type {
  MarketComment,
  MarketCommentRequest,
  MarketItemCard,
  MarketItemCreateRequest,
  MarketItemDetail,
  MarketItemUpdateRequest,
  MarketListParams,
  MarketPage,
  MarketPageParams,
  MarketToggleResponse,
} from "@/types/market";

const defaultPageParams = {
  page: 0,
  size: 20,
  sort: ["createdAt,desc"],
};

const encodeId = (value: number | string) => encodeURIComponent(String(value));

export const getMarketItems = (params: MarketListParams = {}) =>
  fetchAPI("/api/market", "GET", {
    ...defaultPageParams,
    ...params,
  }) as Promise<MarketPage<MarketItemCard>>;

export const getMarketItem = (id: number | string) =>
  fetchAPI(`/api/market/${encodeId(id)}`, "GET") as Promise<MarketItemDetail>;

export const createMarketItem = (body: MarketItemCreateRequest) =>
  fetchAPI("/api/market", "POST", body) as Promise<MarketItemDetail>;

export const updateMarketItem = ({
  id,
  body,
}: {
  id: number | string;
  body: MarketItemUpdateRequest;
}) =>
  fetchAPI(
    `/api/market/${encodeId(id)}`,
    "PUT",
    body,
  ) as Promise<MarketItemDetail>;

export const deleteMarketItem = (id: number | string) =>
  fetchAPI(`/api/market/${encodeId(id)}`, "DELETE") as Promise<null>;

export const toggleMarketLike = (id: number | string) =>
  fetchAPI(
    `/api/market/${encodeId(id)}/like`,
    "POST",
  ) as Promise<MarketToggleResponse>;

export const toggleMarketScrap = (id: number | string) =>
  fetchAPI(
    `/api/market/${encodeId(id)}/scrap`,
    "POST",
  ) as Promise<MarketToggleResponse>;

export const getMarketComments = (
  marketId: number | string,
  params: MarketPageParams = {},
) =>
  fetchAPI(`/api/market/${encodeId(marketId)}/comments`, "GET", {
    ...defaultPageParams,
    ...params,
  }) as Promise<MarketPage<MarketComment>>;

export const createMarketComment = ({
  marketId,
  body,
}: {
  marketId: number | string;
  body: MarketCommentRequest;
}) =>
  fetchAPI(
    `/api/market/${encodeId(marketId)}/comments`,
    "POST",
    body,
  ) as Promise<MarketComment>;

export const updateMarketComment = ({
  commentId,
  body,
}: {
  commentId: number | string;
  body: MarketCommentRequest;
}) =>
  fetchAPI(
    `/api/market/comments/${encodeId(commentId)}`,
    "PUT",
    body,
  ) as Promise<MarketComment>;

export const deleteMarketComment = (commentId: number | string) =>
  fetchAPI(
    `/api/market/comments/${encodeId(commentId)}`,
    "DELETE",
  ) as Promise<null>;

export const getMarketSample = async (id: number | string) => {
  const response = await fetchAPI(`/api/market/${encodeId(id)}/sample`, "GET");

  if (typeof response === "string") return response;
  if (response && typeof response.url === "string") return response.url;
  if (response && typeof response.data === "string") return response.data;

  throw new Error("맛보기 URL을 확인할 수 없습니다.");
};

export const getSellerMarketItems = (
  sellerId: number | string,
  params: MarketPageParams = {},
) =>
  fetchAPI(`/api/market/sellers/${encodeId(sellerId)}`, "GET", {
    ...defaultPageParams,
    ...params,
  }) as Promise<MarketPage<MarketItemCard>>;
