import { fetchAPI } from "@/lib/client/fetch";
import { useQuery } from "@tanstack/react-query";

export type BoardScrapStatus = {
  isScrapped: boolean;
  scrapCount: number;
};

const normalizeBoardScrapStatus = (response: any): BoardScrapStatus => ({
  isScrapped: Boolean(
    response?.scrapWhether ??
      response?.isScrapped ??
      response?.scrapped ??
      false,
  ),
  scrapCount: Number(response?.scrapCount ?? response?.scraps ?? 0),
});

export const boardScrapStatusQueryKey = (boardId: string) =>
  ["board-scrap-status", boardId] as const;

export const getBoardScrapStatus = async (boardId: string) => {
  const response = await fetchAPI(`/api/boards/${boardId}/scrapCount`, "GET");
  return normalizeBoardScrapStatus(response);
};

export const useBoardScrapStatusQuery = (boardId: string) => {
  return useQuery({
    queryKey: boardScrapStatusQueryKey(boardId),
    queryFn: () => getBoardScrapStatus(boardId),
    enabled: Boolean(boardId),
  });
};
