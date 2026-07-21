import {
  fetchAPI,
  getValidAccessToken,
  refreshTokens,
} from "@/lib/client/fetch";
import type {
  BlindMask,
  CardState,
  CardType,
  Flashcard,
  FlashcardDraft,
  Rating,
} from "@/types/flashcard";

type ApiCardType = "CONCEPT" | "RELATION" | "COMPARE" | "BLIND";
type ApiCardState = "LEARNING" | "DUE" | "GRADUATED";
type ApiRating = "AGAIN" | "HARD" | "GOOD" | "EASY";

type FlashcardDto = {
  id: number | string;
  type: ApiCardType | string;
  ease?: number | null;
  interval?: number | null;
  reps?: number | null;
  lapses?: number | null;
  state?: ApiCardState | string | null;
  due?: string | number | null;
  lastReviewed?: string | number | null;
  lastRating?: ApiRating | string | null;
  againCount?: number | null;
  hardCount?: number | null;
  goodCount?: number | null;
  easyCount?: number | null;
  weak?: boolean | null;
  createdAt?: string | number | null;
  updatedAt?: string | number | null;
  term?: string | null;
  definition?: string | null;
  triggerText?: string | null;
  effect?: string | null;
  mechanism?: string | null;
  nameA?: string | null;
  nameB?: string | null;
  common?: string | null;
  difference?: string | null;
  title?: string | null;
  imageUrl?: string | null;
  masksJson?: string | null;
};

type FlashcardPageDto = {
  content?: FlashcardDto[];
  data?: FlashcardDto[] | { content?: FlashcardDto[] };
  totalElements?: number;
  totalPages?: number;
  number?: number;
  size?: number;
};

type FlashcardStatsDto = {
  totalCards?: number;
  againToday?: number;
  streak?: number;
  typeDistribution?: Partial<Record<ApiCardType, number>>;
};

export type FlashcardStats = {
  totalCards: number;
  againToday: number;
  streak: number;
  typeDistribution: Record<CardType, number>;
};

export type FlashcardPage = {
  cards: Flashcard[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
};

const apiTypeToLocal: Record<ApiCardType, CardType> = {
  CONCEPT: "concept",
  RELATION: "relation",
  COMPARE: "compare",
  BLIND: "blind",
};

const localTypeToApi: Record<CardType, ApiCardType> = {
  concept: "CONCEPT",
  relation: "RELATION",
  compare: "COMPARE",
  blind: "BLIND",
};

const apiRatingToLocal: Record<ApiRating, Rating> = {
  AGAIN: "again",
  HARD: "hard",
  GOOD: "good",
  EASY: "easy",
};

const localRatingToApi: Record<Rating, ApiRating> = {
  again: "AGAIN",
  hard: "HARD",
  good: "GOOD",
  easy: "EASY",
};

const apiStateToLocal: Record<ApiCardState, CardState> = {
  LEARNING: "learning",
  DUE: "due",
  GRADUATED: "graduated",
};

const toNumber = (value: unknown, fallback = 0) =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;

const toText = (value: unknown) => (typeof value === "string" ? value : "");

const toTime = (value: unknown, fallback = Date.now()) => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Date.parse(value);
    if (Number.isFinite(parsed)) return parsed;
  }

  return fallback;
};

const toOptionalTime = (value: unknown) => {
  if (value === null || value === undefined || value === "") return undefined;
  return toTime(value);
};

const toLocalType = (value: unknown): CardType => {
  const key = String(value ?? "").toUpperCase() as ApiCardType;
  return apiTypeToLocal[key] ?? "concept";
};

const toLocalState = (value: unknown): CardState => {
  const key = String(value ?? "").toUpperCase() as ApiCardState;
  return apiStateToLocal[key] ?? "learning";
};

const toLocalRating = (value: unknown): Rating | null => {
  if (!value) return null;
  const key = String(value).toUpperCase() as ApiRating;
  return apiRatingToLocal[key] ?? null;
};

const getImageUrl = (value: unknown) => {
  const imageUrl = toText(value);
  if (!imageUrl) return "";
  if (/^(https?:|data:|blob:)/i.test(imageUrl) || imageUrl.startsWith("/")) {
    return imageUrl;
  }

  const baseUrl = process.env.NEXT_PUBLIC_API_HOST?.replace(/\/$/, "");
  return baseUrl ? `${baseUrl}/${imageUrl.replace(/^\/+/, "")}` : imageUrl;
};

const parseMasks = (value: unknown, cardId: string): BlindMask[] => {
  if (!value) return [];

  try {
    const parsed = typeof value === "string" ? JSON.parse(value) : value;
    if (!Array.isArray(parsed)) return [];

    return parsed.map((mask, index) => ({
      id: toText(mask?.id) || `${cardId}-mask-${index}`,
      x: toNumber(mask?.x),
      y: toNumber(mask?.y),
      width: toNumber(mask?.w ?? mask?.width),
      height: toNumber(mask?.h ?? mask?.height),
      points: Array.isArray(mask?.points) ? mask.points : undefined,
    }));
  } catch {
    return [];
  }
};

const serializeMasks = (masks: BlindMask[]) =>
  JSON.stringify(
    masks.map((mask) => ({
      id: mask.id,
      x: mask.x,
      y: mask.y,
      w: mask.width,
      h: mask.height,
      ...(mask.points?.length ? { points: mask.points } : {}),
    })),
  );

export const toReviewLog = (card: Flashcard) => {
  if (!card.lastRating || !card.lastReviewed) return null;

  return {
    cardId: card.id,
    rating: card.lastRating,
    at: card.lastReviewed,
    intervalAfter: card.interval,
  };
};

export const buildReviewLogs = (cards: Flashcard[]) =>
  cards
    .map(toReviewLog)
    .filter((log): log is NonNullable<ReturnType<typeof toReviewLog>> =>
      Boolean(log),
    )
    .sort((left, right) => left.at - right.at);

export const mergeFlashcards = (...groups: Flashcard[][]) => {
  const byId = new Map<string, Flashcard>();

  groups.flat().forEach((card) => {
    byId.set(card.id, card);
  });

  return [...byId.values()].sort(
    (left, right) => right.createdAt - left.createdAt,
  );
};

export function mapFlashcardDto(dto: FlashcardDto): Flashcard {
  const id = String(dto.id);
  const now = Date.now();
  const base = {
    id,
    type: toLocalType(dto.type),
    createdAt: toTime(dto.createdAt, now),
    updatedAt: toOptionalTime(dto.updatedAt),
    ease: toNumber(dto.ease, 2.5),
    interval: toNumber(dto.interval),
    reps: toNumber(dto.reps),
    lapses: toNumber(dto.lapses),
    state: toLocalState(dto.state),
    due: toTime(dto.due, now),
    lastReviewed: toOptionalTime(dto.lastReviewed),
    lastRating: toLocalRating(dto.lastRating),
    againCount: toNumber(dto.againCount),
    hardCount: toNumber(dto.hardCount),
    goodCount: toNumber(dto.goodCount),
    easyCount: toNumber(dto.easyCount),
    weak: typeof dto.weak === "boolean" ? dto.weak : undefined,
  };

  if (base.type === "relation") {
    return {
      ...base,
      type: "relation",
      trigger: toText(dto.triggerText),
      effect: toText(dto.effect),
      mechanism: toText(dto.mechanism),
    };
  }

  if (base.type === "compare") {
    return {
      ...base,
      type: "compare",
      nameA: toText(dto.nameA),
      nameB: toText(dto.nameB),
      common: toText(dto.common),
      difference: toText(dto.difference),
    };
  }

  if (base.type === "blind") {
    return {
      ...base,
      type: "blind",
      title: toText(dto.title),
      imageUrl: getImageUrl(dto.imageUrl),
      masks: parseMasks(dto.masksJson, id),
    };
  }

  return {
    ...base,
    type: "concept",
    term: toText(dto.term),
    definition: toText(dto.definition),
  };
}

const unwrapPageContent = (payload: FlashcardPageDto) => {
  if (Array.isArray(payload.content)) return payload.content;
  if (Array.isArray(payload.data)) return payload.data;
  if (
    payload.data &&
    !Array.isArray(payload.data) &&
    Array.isArray(payload.data.content)
  ) {
    return payload.data.content;
  }
  return [];
};

const mapStats = (payload: FlashcardStatsDto | null | undefined) => {
  const distribution = payload?.typeDistribution ?? {};

  return {
    totalCards: toNumber(payload?.totalCards),
    againToday: toNumber(payload?.againToday),
    streak: toNumber(payload?.streak),
    typeDistribution: {
      concept: toNumber(distribution.CONCEPT),
      relation: toNumber(distribution.RELATION),
      compare: toNumber(distribution.COMPARE),
      blind: toNumber(distribution.BLIND),
    },
  } satisfies FlashcardStats;
};

const getErrorMessage = (payload: unknown, fallback: string) => {
  if (payload && typeof payload === "object") {
    const error = payload as {
      message?: unknown;
      error?: unknown;
      code?: unknown;
    };

    for (const value of [error.message, error.error, error.code]) {
      if (typeof value === "string" && value.trim()) return value;
    }
  }

  return fallback;
};

const normalizeToken = (token: string) => token.replace(/^(Bearer\s+)+/i, "");

async function fetchFormData(url: string, formData: FormData) {
  const send = (token?: string | null) =>
    fetch(url, {
      method: "POST",
      headers: token
        ? { Authorization: `Bearer ${normalizeToken(token)}` }
        : undefined,
      body: formData,
      credentials: "same-origin",
    });

  let response = await send(await getValidAccessToken());

  if (response.status === 401 || response.status === 403) {
    const refreshed = await refreshTokens();
    if (refreshed) response = await send(refreshed.access_token);
  }

  const responseText = await response.text();
  let payload: unknown = null;

  if (responseText.trim()) {
    try {
      payload = JSON.parse(responseText);
    } catch {
      payload = { message: responseText };
    }
  }

  if (!response.ok) {
    throw new Error(
      getErrorMessage(
        payload,
        `플래시카드 요청에 실패했습니다. (${response.status})`,
      ),
    );
  }

  return payload;
}

function dataUrlToFile(dataUrl: string, fileName: string) {
  const [meta = "", data = ""] = dataUrl.split(",");
  const mime = meta.match(/data:(.*?);base64/i)?.[1] ?? "image/jpeg";
  const binary = atob(data);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return new File([bytes], fileName, { type: mime });
}

function getCreatePayload(draft: Exclude<FlashcardDraft, { type: "blind" }>) {
  const type = localTypeToApi[draft.type];

  if (draft.type === "relation") {
    return {
      type,
      triggerText: draft.trigger,
      effect: draft.effect,
      mechanism: draft.mechanism,
    };
  }

  if (draft.type === "compare") {
    return {
      type,
      nameA: draft.nameA,
      nameB: draft.nameB,
      common: draft.common,
      difference: draft.difference,
    };
  }

  return {
    type,
    term: draft.term,
    definition: draft.definition,
  };
}

type FlashcardPageParams = {
  type?: CardType;
  page?: number;
  size?: number;
  sort?: string;
};

export async function fetchFlashcardPage({
  type,
  page = 0,
  size = 200,
  sort = "createdAt,desc",
}: FlashcardPageParams = {}): Promise<FlashcardPage> {
  const query = new URLSearchParams({
    page: String(page),
    size: String(size),
    sort,
  });

  if (type) query.set("type", localTypeToApi[type]);

  const payload = (await fetchAPI(
    `/api/flashcards?${query.toString()}`,
    "GET",
  )) as FlashcardPageDto;
  const content = unwrapPageContent(payload);

  return {
    cards: content.map(mapFlashcardDto),
    totalElements: toNumber(payload.totalElements, content.length),
    totalPages: toNumber(payload.totalPages, 1),
    number: toNumber(payload.number, page),
    size: toNumber(payload.size, size),
  };
}

export async function fetchAllFlashcards({
  type,
  size = 200,
  sort = "createdAt,desc",
}: Omit<FlashcardPageParams, "page"> = {}) {
  const firstPage = await fetchFlashcardPage({ type, page: 0, size, sort });
  const cards = [...firstPage.cards];

  for (let page = 1; page < firstPage.totalPages; page += 1) {
    const nextPage = await fetchFlashcardPage({ type, page, size, sort });
    cards.push(...nextPage.cards);
  }

  return mergeFlashcards(cards);
}

export async function fetchFlashcardById(cardId: string) {
  const payload = (await fetchAPI(
    `/api/flashcards/${cardId}`,
    "GET",
  )) as FlashcardDto;
  return mapFlashcardDto(payload);
}

export async function fetchDueFlashcards() {
  const payload = (await fetchAPI("/api/flashcards/due", "GET")) as
    | FlashcardDto[]
    | null;
  return Array.isArray(payload) ? payload.map(mapFlashcardDto) : [];
}

export async function fetchAgainTodayFlashcards() {
  const payload = (await fetchAPI("/api/flashcards/again-today", "GET")) as
    | FlashcardDto[]
    | null;
  return Array.isArray(payload) ? payload.map(mapFlashcardDto) : [];
}

export async function fetchWeakFlashcards(folder: Rating) {
  const payload = (await fetchAPI("/api/flashcards/weak", "GET", {
    folder: localRatingToApi[folder],
  })) as FlashcardDto[] | null;
  return Array.isArray(payload) ? payload.map(mapFlashcardDto) : [];
}

export async function fetchFlashcardStats() {
  const payload = (await fetchAPI(
    "/api/flashcards/stats",
    "GET",
  )) as FlashcardStatsDto | null;
  return mapStats(payload);
}

export async function createRemoteFlashcard(draft: FlashcardDraft) {
  if (draft.type === "blind") {
    const formData = new FormData();
    formData.append("title", draft.title);
    formData.append("masks", serializeMasks(draft.masks));
    formData.append(
      "image",
      draft.imageFile ??
        dataUrlToFile(draft.imageUrl, `${draft.title || "blind-card"}.jpg`),
    );

    const payload = (await fetchFormData(
      "/api/flashcards/blind",
      formData,
    )) as FlashcardDto;
    return mapFlashcardDto(payload);
  }

  const payload = (await fetchAPI(
    "/api/flashcards",
    "POST",
    getCreatePayload(draft),
  )) as FlashcardDto;
  return mapFlashcardDto(payload);
}

export async function deleteRemoteFlashcard(cardId: string) {
  await fetchAPI(`/api/flashcards/${cardId}`, "DELETE");
}

export async function reviewRemoteFlashcard(cardId: string, rating: Rating) {
  const payload = (await fetchAPI(`/api/flashcards/${cardId}/review`, "POST", {
    rating: localRatingToApi[rating],
  })) as FlashcardDto;
  return mapFlashcardDto(payload);
}
