import { useQuery } from "@tanstack/react-query";
import type { UseQueryOptions } from "@tanstack/react-query";

import {
  getMarketComments,
  getMarketItem,
  getMarketItems,
  getSellerMarketItems,
} from "@/lib/market/api";
import type {
  MarketComment,
  MarketItemCard,
  MarketItemDetail,
  MarketListParams,
  MarketPage,
  MarketPageParams,
} from "@/types/market";

type QueryOptions<T> = Omit<UseQueryOptions<T, Error>, "queryKey" | "queryFn">;

export const marketItemsQueryKey = (params: MarketListParams = {}) =>
  ["market", "items", params] as const;

export const marketDetailQueryKey = (id?: number | string | null) =>
  ["market", "detail", id] as const;

export const marketCommentsQueryKey = (
  marketId?: number | string | null,
  params: MarketPageParams = {},
) => ["market", "comments", marketId, params] as const;

export const sellerMarketItemsQueryKey = (
  sellerId?: number | string | null,
  params: MarketPageParams = {},
) => ["market", "seller", sellerId, params] as const;

export const useMarketItemsQuery = (
  params: MarketListParams = {},
  options?: QueryOptions<MarketPage<MarketItemCard>>,
) =>
  useQuery({
    queryKey: marketItemsQueryKey(params),
    queryFn: () => getMarketItems(params),
    ...options,
  });

export const useMarketDetailQuery = (
  id?: number | string | null,
  options?: QueryOptions<MarketItemDetail>,
) =>
  useQuery({
    queryKey: marketDetailQueryKey(id),
    queryFn: () => getMarketItem(id as number | string),
    ...options,
    enabled: Boolean(id) && (options?.enabled ?? true),
  });

export const useMarketCommentsQuery = (
  marketId?: number | string | null,
  params: MarketPageParams = {},
  options?: QueryOptions<MarketPage<MarketComment>>,
) =>
  useQuery({
    queryKey: marketCommentsQueryKey(marketId, params),
    queryFn: () => getMarketComments(marketId as number | string, params),
    ...options,
    enabled: Boolean(marketId) && (options?.enabled ?? true),
  });

export const useSellerMarketItemsQuery = (
  sellerId?: number | string | null,
  params: MarketPageParams = {},
  options?: QueryOptions<MarketPage<MarketItemCard>>,
) =>
  useQuery({
    queryKey: sellerMarketItemsQueryKey(sellerId, params),
    queryFn: () => getSellerMarketItems(sellerId as number | string, params),
    ...options,
    enabled: Boolean(sellerId) && (options?.enabled ?? true),
  });
