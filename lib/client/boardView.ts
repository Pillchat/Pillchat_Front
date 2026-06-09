const BOARD_VIEW_INTENT_STORAGE_KEY = "yakchat:board-view-intent";
const BOARD_VIEW_INTENT_TTL_MS = 15_000;
const BOARD_VIEW_COUNT_STORAGE_KEY = "yakchat:board-view-counts";
const BOARD_VIEW_COUNT_TTL_MS = 10 * 60 * 1000;
const DEV_INTENT_REUSE_COUNT = process.env.NODE_ENV === "production" ? 0 : 1;

type BoardViewIntent = {
  boardId: string;
  expiresAt: number;
};

type BoardViewCountEntry = {
  viewCount: number;
  expiresAt: number;
};

declare global {
  interface Window {
    __yakchatBoardViewIntentCache__?: Record<string, number>;
    __yakchatBoardViewCountCache__?: Record<string, BoardViewCountEntry>;
  }
}

const getBoardViewIntentCache = () => {
  if (typeof window === "undefined") return {};

  window.__yakchatBoardViewIntentCache__ ??= {};
  return window.__yakchatBoardViewIntentCache__;
};

const persistBoardViewCountCache = (
  cache: Record<string, BoardViewCountEntry>,
) => {
  if (typeof window === "undefined") return;

  const entries = Object.entries(cache);

  if (entries.length === 0) {
    window.sessionStorage.removeItem(BOARD_VIEW_COUNT_STORAGE_KEY);
    return;
  }

  window.sessionStorage.setItem(
    BOARD_VIEW_COUNT_STORAGE_KEY,
    JSON.stringify(Object.fromEntries(entries)),
  );
};

const readBoardViewCountCache = () => {
  if (typeof window === "undefined") return {};

  const rawCache = window.sessionStorage.getItem(BOARD_VIEW_COUNT_STORAGE_KEY);
  if (!rawCache) return {};

  try {
    const parsedCache = JSON.parse(rawCache) as Record<
      string,
      Partial<BoardViewCountEntry>
    >;
    const now = Date.now();
    const cleanedCache = Object.entries(parsedCache).reduce<
      Record<string, BoardViewCountEntry>
    >((acc, [boardId, entry]) => {
      const normalizedBoardId = String(boardId ?? "").trim();
      const normalizedViewCount = Number(entry?.viewCount);
      const expiresAt = Number(entry?.expiresAt);

      if (!normalizedBoardId) return acc;
      if (!Number.isFinite(normalizedViewCount)) return acc;
      if (!Number.isFinite(expiresAt) || expiresAt < now) return acc;

      acc[normalizedBoardId] = {
        viewCount: Math.max(0, Math.trunc(normalizedViewCount)),
        expiresAt,
      };

      return acc;
    }, {});

    const hasChanged =
      Object.keys(cleanedCache).length !== Object.keys(parsedCache).length;

    if (hasChanged) {
      persistBoardViewCountCache(cleanedCache);
    }

    return cleanedCache;
  } catch {
    window.sessionStorage.removeItem(BOARD_VIEW_COUNT_STORAGE_KEY);
    return {};
  }
};

const getBoardViewCountCache = () => {
  if (typeof window === "undefined") return {};

  window.__yakchatBoardViewCountCache__ ??= readBoardViewCountCache();
  return window.__yakchatBoardViewCountCache__;
};

export const markBoardViewIntent = (boardId: string | number) => {
  if (typeof window === "undefined") return;

  const normalizedBoardId = String(boardId ?? "").trim();
  if (!normalizedBoardId) return;

  const intent: BoardViewIntent = {
    boardId: normalizedBoardId,
    expiresAt: Date.now() + BOARD_VIEW_INTENT_TTL_MS,
  };

  window.sessionStorage.setItem(
    BOARD_VIEW_INTENT_STORAGE_KEY,
    JSON.stringify(intent),
  );
};

export const shouldSkipBoardViewOnLoad = (boardId: string | number) => {
  if (typeof window === "undefined") return true;

  const normalizedBoardId = String(boardId ?? "").trim();
  if (!normalizedBoardId) return true;

  const cache = getBoardViewIntentCache();
  const cachedCount = cache[normalizedBoardId] ?? 0;

  if (cachedCount > 0) {
    if (cachedCount === 1) {
      delete cache[normalizedBoardId];
    } else {
      cache[normalizedBoardId] = cachedCount - 1;
    }

    return false;
  }

  const rawIntent = window.sessionStorage.getItem(
    BOARD_VIEW_INTENT_STORAGE_KEY,
  );
  if (!rawIntent) return true;

  try {
    const parsedIntent = JSON.parse(rawIntent) as Partial<BoardViewIntent>;
    const isExpired =
      typeof parsedIntent.expiresAt !== "number" ||
      parsedIntent.expiresAt < Date.now();

    if (isExpired || parsedIntent.boardId !== normalizedBoardId) {
      window.sessionStorage.removeItem(BOARD_VIEW_INTENT_STORAGE_KEY);
      return true;
    }

    window.sessionStorage.removeItem(BOARD_VIEW_INTENT_STORAGE_KEY);

    if (DEV_INTENT_REUSE_COUNT > 0) {
      cache[normalizedBoardId] = DEV_INTENT_REUSE_COUNT;
    }

    return false;
  } catch {
    window.sessionStorage.removeItem(BOARD_VIEW_INTENT_STORAGE_KEY);
    return true;
  }
};

export const rememberBoardViewCount = (
  boardId: string | number,
  viewCount: number,
) => {
  if (typeof window === "undefined") return;

  const normalizedBoardId = String(boardId ?? "").trim();
  const normalizedViewCount = Number(viewCount);

  if (!normalizedBoardId || !Number.isFinite(normalizedViewCount)) return;

  const cache = getBoardViewCountCache();
  const currentEntry = cache[normalizedBoardId];
  const nextViewCount = Math.max(
    currentEntry?.viewCount ?? 0,
    Math.max(0, Math.trunc(normalizedViewCount)),
  );

  cache[normalizedBoardId] = {
    viewCount: nextViewCount,
    expiresAt: Date.now() + BOARD_VIEW_COUNT_TTL_MS,
  };

  persistBoardViewCountCache(cache);
};

export const getRememberedBoardViewCounts = () => {
  if (typeof window === "undefined") return {};

  const cache = getBoardViewCountCache();
  const now = Date.now();
  let changed = false;

  Object.keys(cache).forEach((boardId) => {
    if (cache[boardId].expiresAt < now) {
      delete cache[boardId];
      changed = true;
    }
  });

  if (changed) {
    persistBoardViewCountCache(cache);
  }

  return Object.entries(cache).reduce<Record<string, number>>(
    (acc, [boardId, entry]) => {
      acc[boardId] = entry.viewCount;
      return acc;
    },
    {},
  );
};
