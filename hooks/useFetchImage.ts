import { useFilesQuery } from "@/hooks/queries";

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
  const { data: imageData, isLoading: imageLoading } = useFilesQuery({
    type,
    sourceId,
    sourceKey,
    images,
  });

  return { imageData, imageLoading };
};
