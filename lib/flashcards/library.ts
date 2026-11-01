import type { Flashcard } from "@/types/flashcard";
import type { FlashcardPack } from "./api";
import {
  DEFAULT_FLASHCARD_COLLECTION,
  type FlashcardCollectionMap,
} from "./collections";

export function flashcardGroups(
  cards: Flashcard[],
  collections: FlashcardCollectionMap,
  packs?: FlashcardPack[],
) {
  const groups = new Map<
    string,
    { id: string; name: string; cards: Flashcard[] }
  >();
  for (const pack of packs ?? [])
    groups.set(pack.packId, { id: pack.packId, name: pack.title, cards: [] });
  for (const card of cards.slice().sort((a, b) => b.createdAt - a.createdAt)) {
    const name = collections[card.id] ?? DEFAULT_FLASHCARD_COLLECTION;
    const id = card.packId ?? "legacy:" + name;
    const group = groups.get(id) ?? { id, name, cards: [] };
    group.cards.push(card);
    groups.set(id, group);
  }
  return [...groups.values()].map((group) => {
    const dates = group.cards
      .map((card) => card.lastReviewed)
      .filter((date): date is number => date != null && Number.isFinite(date));
    return {
      ...group,
      reviewedCount: dates.length,
      progress: group.cards.length
        ? Math.round((dates.length / group.cards.length) * 100)
        : 0,
      lastReviewed: dates.length ? Math.max(...dates) : null,
    };
  });
}

export function flashcardReviewDate(value: number | null) {
  return value == null
    ? "학습 전"
    : new Intl.DateTimeFormat("ko-KR", {
        timeZone: "Asia/Seoul",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(value);
}
