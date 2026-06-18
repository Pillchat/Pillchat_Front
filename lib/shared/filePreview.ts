type FileValue =
  | string
  | {
      urlKey?: string;
      key?: string;
      fileKey?: string;
      name?: string;
      preSignedUrl?: string;
      presignedUrl?: string;
      uploadUrl?: string;
    };

export const getFileKey = (value: FileValue | null | undefined) => {
  if (!value) return "";
  if (typeof value === "string") return value;

  return value.urlKey ?? value.key ?? value.fileKey ?? value.name ?? "";
};

export const getFilePreviewUrl = (value: FileValue | null | undefined) => {
  if (!value || typeof value === "string") return "";

  return value.preSignedUrl ?? value.presignedUrl ?? value.uploadUrl ?? "";
};

export const isPdfFileKey = (key: string) => key.toLowerCase().endsWith(".pdf");

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
