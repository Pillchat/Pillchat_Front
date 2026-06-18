import { fetchAPI } from "@/lib/client/fetch";
import { useQuery } from "@tanstack/react-query";

export type LikeTargetType = "questions" | "answers" | "boards";

export type LikeStatus = {
  isLiked: boolean;
  likeCount: number;
};

const normalizeLikeStatus = (response: any): LikeStatus => ({
  isLiked: Boolean(response?.likeWhether ?? response?.liked ?? false),
  likeCount: Number(response?.likeCount ?? response?.likes ?? 0),
});

export const likeStatusQueryKey = (type: LikeTargetType, id: string) =>
  ["like-status", type, id] as const;

export const getLikeStatus = async (
  id: string,
  type: LikeTargetType = "questions",
) => {
  const response = await fetchAPI(`/api/${type}/${id}/likeCount`, "GET");
  return normalizeLikeStatus(response);
};

export const useLikeStatusQuery = (
  id: string,
  type: LikeTargetType = "questions",
) => {
  return useQuery({
    queryKey: likeStatusQueryKey(type, id),
    queryFn: () => getLikeStatus(id, type),
    enabled: Boolean(id),
  });
};
