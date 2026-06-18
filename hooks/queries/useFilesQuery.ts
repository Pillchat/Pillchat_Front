import { fetchAPI } from "@/lib/client/fetch";
import { useQuery } from "@tanstack/react-query";

type ImageFile = {
  id: string;
  urlKey: string;
};

type UseFilesQueryParams = {
  type?: string;
  sourceId?: string;
  sourceKey?: string;
  images?: ImageFile[];
  keys?: string[];
};

const buildFileKeys = ({
  type,
  sourceId,
  sourceKey,
  images,
  keys,
}: UseFilesQueryParams) => {
  if (keys) return keys;
  if (sourceKey) return [sourceKey];
  return images?.map((image) => `${type}/${sourceId}/${image.urlKey}`) ?? [];
};

export const filesQueryKey = ({
  type,
  sourceId,
  sourceKey,
  images,
  keys,
}: UseFilesQueryParams) =>
  ["files", type, sourceId, sourceKey, images, keys] as const;

export const getFiles = (params: UseFilesQueryParams) => {
  const keys = buildFileKeys(params);
  if (keys.length === 0) return Promise.resolve([]);

  return fetchAPI("/api/files", "GET", { keys });
};

export const useFilesQuery = (params: UseFilesQueryParams) => {
  const hasKeys =
    Boolean(params.keys?.length) ||
    Boolean(params.sourceKey) ||
    Boolean(params.images?.length);

  return useQuery({
    queryKey: filesQueryKey(params),
    queryFn: () => getFiles(params),
    enabled:
      Boolean(params.keys?.length) ||
      (((!!params.sourceId && !!params.images) || !!params.sourceKey) &&
        hasKeys),
  });
};
