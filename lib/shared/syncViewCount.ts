type ViewCountItem = {
  id?: string | number;
  viewCount?: number;
};

const normalizeViewCount = (value: number) => {
  if (!Number.isFinite(value)) return null;
  return Math.max(0, Math.trunc(value));
};

const updateItemViewCount = <T extends ViewCountItem>(
  item: T,
  targetId: string,
  nextViewCount: number,
) => {
  if (String(item?.id ?? "") !== targetId) return item;

  const currentViewCount =
    normalizeViewCount(Number(item?.viewCount ?? 0)) ?? 0;
  const resolvedViewCount = Math.max(currentViewCount, nextViewCount);

  if (currentViewCount === resolvedViewCount) return item;

  return {
    ...item,
    viewCount: resolvedViewCount,
  };
};

export const syncViewCountInQueryData = <T extends ViewCountItem>(
  data: T[] | { data?: T[] } | null | undefined,
  targetId: string | number,
  viewCount: number,
) => {
  const normalizedId = String(targetId ?? "").trim();
  const normalizedViewCount = normalizeViewCount(Number(viewCount));

  if (!normalizedId || normalizedViewCount === null) return data;

  if (Array.isArray(data)) {
    let changed = false;

    const nextData = data.map((item) => {
      const updatedItem = updateItemViewCount(
        item,
        normalizedId,
        normalizedViewCount,
      );

      if (updatedItem !== item) {
        changed = true;
      }

      return updatedItem;
    });

    return changed ? nextData : data;
  }

  if (data && typeof data === "object" && Array.isArray(data.data)) {
    let changed = false;

    const nextItems = data.data.map((item) => {
      const updatedItem = updateItemViewCount(
        item,
        normalizedId,
        normalizedViewCount,
      );

      if (updatedItem !== item) {
        changed = true;
      }

      return updatedItem;
    });

    return changed
      ? {
          ...data,
          data: nextItems,
        }
      : data;
  }

  return data;
};
