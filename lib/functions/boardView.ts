const BOARD_VIEW_INTENT_STORAGE_KEY = "yakchat:board-view-intent";
const BOARD_VIEW_INTENT_TTL_MS = 15_000;
const DEV_INTENT_REUSE_COUNT = process.env.NODE_ENV === "production" ? 0 : 1;

type BoardViewIntent = {
  boardId: string;
  expiresAt: number;
};

declare global {
  interface Window {
    __yakchatBoardViewIntentCache__?: Record<string, number>;
  }
}

const getBoardViewIntentCache = () => {
  if (typeof window === "undefined") return {};

  window.__yakchatBoardViewIntentCache__ ??= {};
  return window.__yakchatBoardViewIntentCache__;
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

  const rawIntent = window.sessionStorage.getItem(BOARD_VIEW_INTENT_STORAGE_KEY);
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
