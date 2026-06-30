import { fetchAPI } from "@/lib/client/fetch";
import { useMutation } from "@tanstack/react-query";

type ToggleBoardScrapPayload = {
  boardId: string;
  isScrapped: boolean;
};

export const toggleBoardScrap = ({
  boardId,
  isScrapped,
}: ToggleBoardScrapPayload) => {
  const method = isScrapped ? "DELETE" : "POST";
  return fetchAPI(`/api/boards/${boardId}/scrap`, method);
};

export const useToggleBoardScrapMutation = () => {
  return useMutation({
    mutationFn: toggleBoardScrap,
  });
};
