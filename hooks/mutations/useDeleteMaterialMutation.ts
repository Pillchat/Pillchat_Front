import { fetchAPI } from "@/lib/client/fetch";
import { useMutation } from "@tanstack/react-query";
import type { UseMutationOptions } from "@tanstack/react-query";

export const deleteMaterial = (materialId: string) => {
  return fetchAPI(`/api/materials/${materialId}`, "DELETE");
};

export const useDeleteMaterialMutation = (
  options?: UseMutationOptions<any, Error, string>,
) => {
  return useMutation({
    mutationFn: deleteMaterial,
    ...options,
  });
};
