import { fetchAPI } from "@/lib/functions";
import { useQuery } from "@tanstack/react-query";

export const useFetchImage = ({
  type,
  sourceId,
  sourceKey,
  images,
}: {
  type?: string;
  sourceId?: string;
  sourceKey?: string;
  images?: {
    id: string;
    urlKey: string;
  }[];
}) => {
  const { data: imageData, isLoading: imageLoading } = useQuery({
    queryKey: ["files", type, sourceId, sourceKey, images],
    queryFn: async () => {
      if (!sourceKey && (!images || images.length === 0)) {
        return [];
      }

      const keys = sourceKey
        ? [sourceKey]
        : images?.map((image) => `${type}/${sourceId}/${image.urlKey}`);

      return fetchAPI("/api/files", "GET", { keys });
    },
    enabled: (!!sourceId && !!images) || !!sourceKey,
  });

  return { imageData, imageLoading };
};
