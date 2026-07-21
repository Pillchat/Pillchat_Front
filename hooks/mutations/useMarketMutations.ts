import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  createMarketComment,
  createMarketItem,
  deleteMarketComment,
  deleteMarketItem,
  toggleMarketLike,
  toggleMarketScrap,
  updateMarketComment,
  updateMarketItem,
} from "@/lib/market/api";

const useInvalidateMarket = () => {
  const queryClient = useQueryClient();

  return {
    all: () => queryClient.invalidateQueries({ queryKey: ["market"] }),
  };
};

export const useCreateMarketItemMutation = () => {
  const invalidate = useInvalidateMarket();
  return useMutation({
    mutationFn: createMarketItem,
    onSuccess: invalidate.all,
  });
};

export const useUpdateMarketItemMutation = () => {
  const invalidate = useInvalidateMarket();
  return useMutation({
    mutationFn: updateMarketItem,
    onSuccess: invalidate.all,
  });
};

export const useDeleteMarketItemMutation = () => {
  const invalidate = useInvalidateMarket();
  return useMutation({
    mutationFn: deleteMarketItem,
    onSuccess: invalidate.all,
  });
};

export const useToggleMarketLikeMutation = () => {
  const invalidate = useInvalidateMarket();
  return useMutation({
    mutationFn: toggleMarketLike,
    onSuccess: invalidate.all,
  });
};

export const useToggleMarketScrapMutation = () => {
  const invalidate = useInvalidateMarket();
  return useMutation({
    mutationFn: toggleMarketScrap,
    onSuccess: invalidate.all,
  });
};

export const useCreateMarketCommentMutation = () => {
  const invalidate = useInvalidateMarket();
  return useMutation({
    mutationFn: createMarketComment,
    onSuccess: invalidate.all,
  });
};

export const useUpdateMarketCommentMutation = () => {
  const invalidate = useInvalidateMarket();
  return useMutation({
    mutationFn: updateMarketComment,
    onSuccess: invalidate.all,
  });
};

export const useDeleteMarketCommentMutation = () => {
  const invalidate = useInvalidateMarket();
  return useMutation({
    mutationFn: deleteMarketComment,
    onSuccess: invalidate.all,
  });
};
