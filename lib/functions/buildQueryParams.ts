export const buildQueryParams = (params: Record<string, string | string[]>) => {
  return Object.entries(params)
    .flatMap(([key, value]) => {
      if (Array.isArray(value)) {
        return value.map((v) => `${key}=${encodeURIComponent(v)}`);
      }
      return `${key}=${encodeURIComponent(value)}`;
    })
    .join("&");
};
