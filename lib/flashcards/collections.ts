const FLASHCARD_COLLECTIONS_STORAGE_KEY = "flashcards.collections.v1";

export type FlashcardCollectionMap = Record<string, string>;

export const DEFAULT_FLASHCARD_COLLECTION = "미분류";

export function readFlashcardCollections(): FlashcardCollectionMap {
  if (typeof window === "undefined") return {};

  try {
    const parsed = JSON.parse(
      window.localStorage.getItem(FLASHCARD_COLLECTIONS_STORAGE_KEY) ?? "{}",
    );

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }

    return Object.fromEntries(
      Object.entries(parsed).filter(
        (entry): entry is [string, string] =>
          typeof entry[1] === "string" && entry[1].trim().length > 0,
      ),
    );
  } catch {
    return {};
  }
}

export function writeFlashcardCollections(value: FlashcardCollectionMap) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    FLASHCARD_COLLECTIONS_STORAGE_KEY,
    JSON.stringify(value),
  );
}
