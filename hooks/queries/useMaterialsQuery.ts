import { fetchAPI } from "@/lib/client/fetch";
import { useQuery } from "@tanstack/react-query";
import type { UseQueryOptions } from "@tanstack/react-query";

type MaterialQueryOptions = Omit<UseQueryOptions<any>, "queryKey" | "queryFn">;

export const materialsQueryKey = ["materials", "all"] as const;

export const materialQueryKey = (materialId?: string | null) =>
  ["material", materialId] as const;

export const getMaterials = () => {
  return fetchAPI("/api/materials/all", "GET");
};

export const getMaterial = (materialId: string) => {
  return fetchAPI(`/api/materials/${materialId}`, "GET");
};

export const useMaterialsQuery = (options?: MaterialQueryOptions) => {
  return useQuery({
    queryKey: materialsQueryKey,
    queryFn: getMaterials,
    ...options,
  });
};

export const useMaterialQuery = (
  materialId?: string | null,
  options?: MaterialQueryOptions,
) => {
  return useQuery({
    queryKey: materialQueryKey(materialId),
    queryFn: () => getMaterial(materialId as string),
    ...options,
    enabled: Boolean(materialId) && (options?.enabled ?? true),
  });
};
