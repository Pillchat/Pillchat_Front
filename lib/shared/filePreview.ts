type FileValue =
  | string
  | {
      storageKey?: string;
      urlKey?: string;
      key?: string;
      fileKey?: string;
      name?: string;
      url?: string;
      preSignedUrl?: string;
      presignedUrl?: string;
      uploadUrl?: string;
    };

const isDirectFileUrl = (value: unknown): value is string =>
  typeof value === "string" && /^(?:https?:|data:|blob:)/i.test(value.trim());

export const getFileKey = (value: FileValue | null | undefined) => {
  if (!value) return "";
  if (typeof value === "string") {
    return isDirectFileUrl(value) ? "" : value;
  }

  return (
    [value.storageKey, value.key, value.fileKey, value.urlKey, value.name].find(
      (candidate) =>
        typeof candidate === "string" &&
        candidate.length > 0 &&
        !isDirectFileUrl(candidate),
    ) ?? ""
  );
};

export const getFilePreviewUrl = (value: FileValue | null | undefined) => {
  if (!value) return "";
  if (typeof value === "string") {
    return isDirectFileUrl(value) ? value : "";
  }

  return (
    value.url ??
    value.preSignedUrl ??
    value.presignedUrl ??
    value.uploadUrl ??
    (isDirectFileUrl(value.urlKey) ? value.urlKey : "")
  );
};

export const resolveFilePreviewUrl = (
  value: FileValue | null | undefined,
  fileUrlMap: Record<string, string>,
) => {
  const directUrl = getFilePreviewUrl(value);
  if (directUrl) return directUrl;

  const key = getFileKey(value);
  return key ? (fileUrlMap[key] ?? "") : "";
};

export const isPdfFileKey = (key: string) =>
  /\.pdf(?:$|[?#])/i.test(key.trim());

export const isPdfFile = (value: FileValue | null | undefined) =>
  isPdfFileKey(getFileKey(value) || getFilePreviewUrl(value));

export const buildFileUrlMap = (
  requestedKeys: string[],
  files: FileValue[] | null | undefined,
) => {
  if (!Array.isArray(files)) return {};

  return files.reduce<Record<string, string>>((acc, file, index) => {
    const requestedKey = requestedKeys[index] ?? "";
    const responseKey = getFileKey(file);
    const previewUrl = getFilePreviewUrl(file);

    if (!previewUrl) return acc;

    if (requestedKey) {
      acc[requestedKey] = previewUrl;
    }

    if (responseKey) {
      acc[responseKey] = previewUrl;
    }

    return acc;
  }, {});
};
