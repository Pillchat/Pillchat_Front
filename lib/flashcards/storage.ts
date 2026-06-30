import type { Flashcard, FlashcardDraft, ReviewLog } from "@/types/flashcard";
import { getInitialSrsFields } from "./srs";

export const FLASHCARDS_STORAGE_KEY = "flashcards.v1";
export const FLASHCARD_LOGS_STORAGE_KEY = "flashcards.logs.v1";

function createId() {
  if (typeof window !== "undefined" && window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function parseArray<T>(raw: string | null): T[] {
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function readFlashcards() {
  if (typeof window === "undefined") return [];

  return parseArray<Flashcard>(
    window.localStorage.getItem(FLASHCARDS_STORAGE_KEY),
  );
}

export function readReviewLogs() {
  if (typeof window === "undefined") return [];

  return parseArray<ReviewLog>(
    window.localStorage.getItem(FLASHCARD_LOGS_STORAGE_KEY),
  );
}

export function writeFlashcardData(cards: Flashcard[], logs: ReviewLog[]) {
  if (typeof window === "undefined") return;

  const previousCards = window.localStorage.getItem(FLASHCARDS_STORAGE_KEY);
  const previousLogs = window.localStorage.getItem(FLASHCARD_LOGS_STORAGE_KEY);

  try {
    window.localStorage.setItem(FLASHCARDS_STORAGE_KEY, JSON.stringify(cards));
    window.localStorage.setItem(
      FLASHCARD_LOGS_STORAGE_KEY,
      JSON.stringify(logs),
    );
  } catch (error) {
    if (previousCards === null) {
      window.localStorage.removeItem(FLASHCARDS_STORAGE_KEY);
    } else {
      window.localStorage.setItem(FLASHCARDS_STORAGE_KEY, previousCards);
    }

    if (previousLogs === null) {
      window.localStorage.removeItem(FLASHCARD_LOGS_STORAGE_KEY);
    } else {
      window.localStorage.setItem(FLASHCARD_LOGS_STORAGE_KEY, previousLogs);
    }

    throw error;
  }
}

export function createFlashcard(draft: FlashcardDraft): Flashcard {
  return {
    id: createId(),
    ...getInitialSrsFields(),
    ...draft,
  } as Flashcard;
}

export function createMaskId() {
  return createId();
}

export async function downscaleImage(
  source: string,
  maxSize = 1280,
  quality = 0.78,
) {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const element = new Image();
    element.onload = () => resolve(element);
    element.onerror = reject;
    element.src = source;
  });

  const ratio = Math.min(1, maxSize / Math.max(image.width, image.height));
  const width = Math.max(1, Math.round(image.width * ratio));
  const height = Math.max(1, Math.round(image.height * ratio));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) return source;

  context.drawImage(image, 0, 0, width, height);

  return canvas.toDataURL("image/jpeg", quality);
}

export function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
