"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createNotice } from "@/lib/client/notices";

export function useCreateNoticeMutation() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: createNotice,
    retry: false,
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ["notices"] });
    },
  });
}
