import { fetchAPI } from "@/lib/client/fetch";
import { useQuery } from "@tanstack/react-query";
import type { UseQueryOptions } from "@tanstack/react-query";

type BoardQueryOptions = Omit<UseQueryOptions<any>, "queryKey" | "queryFn">;

type BoardListParams = {
  category?: string;
  sort?: "latest" | "popular" | string;
  page?: number;
  size?: number;
};

type BoardQueryParams = {
  skipView?: boolean;
};

const isBoardListParams = (
  value?: BoardListParams | BoardQueryOptions,
): value is BoardListParams => {
  if (!value) return false;
  return (
    "category" in value || "sort" in value || "page" in value || "size" in value
  );
};

export const boardsQueryKey = (
  status?: string | null,
  params?: BoardListParams,
) =>
  [
    "boards",
    status,
    params?.category,
    params?.sort,
    params?.page,
    params?.size,
  ] as const;

export const boardQueryKey = (
  boardId?: string | null,
  params?: BoardQueryParams,
) => ["board", boardId, params?.skipView] as const;

export const boardCommentsQueryKey = (boardId?: string | null) =>
  ["board-comments", boardId] as const;

const getBoardSort = (status: string, params?: BoardListParams) => {
  if (params?.sort) return params.sort;
  if (status === "latest" || status === "popular") return status;
  if (status === "best") return "popular";
  return undefined;
};

export const getBoards = (status: string, params?: BoardListParams) => {
  const query = new URLSearchParams();
  const sort = getBoardSort(status, params);

  if (params?.category) query.set("category", params.category);
  if (sort) query.set("sort", sort);
  if (params?.page !== undefined) query.set("page", String(params.page));
  if (params?.size !== undefined) query.set("size", String(params.size));

  const queryString = query.toString();
  return fetchAPI(`/api/boards${queryString ? `?${queryString}` : ""}`, "GET");
};

export const getBoard = (boardId: string, params?: BoardQueryParams) => {
  return fetchAPI(`/api/boards/${boardId}`, "GET", {
    ...(params?.skipView !== undefined
      ? { skipView: String(params.skipView) }
      : {}),
  });
};

export const getBoardComments = (boardId: string) => {
  return fetchAPI(`/api/boards/${boardId}/comments`, "GET");
};

export const useBoardsQuery = (
  status: string,
  paramsOrOptions?: BoardListParams | BoardQueryOptions,
  options?: BoardQueryOptions,
) => {
  const params = isBoardListParams(paramsOrOptions)
    ? paramsOrOptions
    : undefined;
  const queryOptions = isBoardListParams(paramsOrOptions)
    ? options
    : paramsOrOptions;

  return useQuery({
    queryKey: boardsQueryKey(status, params),
    queryFn: () => getBoards(status, params),
    ...queryOptions,
  });
};

export const useBoardQuery = (
  boardId?: string | null,
  params?: BoardQueryParams,
  options?: BoardQueryOptions,
) => {
  return useQuery({
    queryKey: boardQueryKey(boardId, params),
    queryFn: () => getBoard(boardId as string, params),
    ...options,
    enabled: Boolean(boardId) && (options?.enabled ?? true),
  });
};

export const useBoardCommentsQuery = (
  boardId?: string | null,
  options?: BoardQueryOptions,
) => {
  return useQuery({
    queryKey: boardCommentsQueryKey(boardId),
    queryFn: () => getBoardComments(boardId as string),
    ...options,
    enabled: Boolean(boardId) && (options?.enabled ?? true),
  });
};
