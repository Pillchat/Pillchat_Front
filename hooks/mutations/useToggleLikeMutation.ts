import { fetchAPI } from "@/lib/client/fetch";
import type { LikeTargetType } from "@/hooks/queries";
import { useMutation } from "@tanstack/react-query";

type ToggleLikePayload = {
  id: string;
  type: LikeTargetType;
  isLiked: boolean;
};

export const toggleLike = ({ id, type, isLiked }: ToggleLikePayload) => {
  const method = isLiked ? "DELETE" : "POST";
  return fetchAPI(`/api/${type}/${id}/like`, method);
};

export const useToggleLikeMutation = () => {
  return useMutation({
    mutationFn: toggleLike,
  });
};
