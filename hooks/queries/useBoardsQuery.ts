import { fetchAPI } from "@/lib/client/fetch";
import { useQuery } from "@tanstack/react-query";
import type { UseQueryOptions } from "@tanstack/react-query";

type BoardQueryOptions = Omit<UseQueryOptions<any>, "queryKey" | "queryFn">;

type BoardQueryParams = {
  skipView?: boolean;
};

export const boardsQueryKey = (status?: string | null) =>
  ["boards", status] as const;

export const boardQueryKey = (
  boardId?: string | null,
  params?: BoardQueryParams,
) => ["board", boardId, params?.skipView] as const;

export const boardCommentsQueryKey = (boardId?: string | null) =>
  ["board-comments", boardId] as const;

export const getBoards = (status: string) => {
  return fetchAPI(`/api/boards?status=${status}`, "GET");
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

export const useBoardsQuery = (status: string, options?: BoardQueryOptions) => {
  return useQuery({
    queryKey: boardsQueryKey(status),
    queryFn: () => getBoards(status),
    ...options,
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
