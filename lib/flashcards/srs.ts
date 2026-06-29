import type { Flashcard, Rating, ReviewLog } from "@/types/flashcard";

const DAY_MS = 24 * 60 * 60 * 1000;
const AGAIN_DELAY_MS = 10 * 60 * 1000;
const MIN_EASE = 1.3;
const INITIAL_EASE = 2.5;

export const ratingLabels: Record<Rating, string> = {
  again: "Again",
  hard: "Hard",
  good: "Good",
  easy: "Easy",
};

export const ratingToneClass: Record<Rating, string> = {
  again: "border-rose-200 bg-rose-50 text-rose-700",
  hard: "border-amber-200 bg-amber-50 text-amber-700",
  good: "border-emerald-200 bg-emerald-50 text-emerald-700",
  easy: "border-blue-200 bg-blue-50 text-blue-700",
};

export function getInitialSrsFields(now = Date.now()) {
  return {
    createdAt: now,
    ease: INITIAL_EASE,
    interval: 0,
    reps: 0,
    lapses: 0,
    state: "learning" as const,
    due: now,
    againCount: 0,
    hardCount: 0,
    goodCount: 0,
    easyCount: 0,
  };
}

export function rateFlashcard(
  card: Flashcard,
  rating: Rating,
  now = Date.now(),
): { card: Flashcard; log: ReviewLog } {
  let ease = card.ease;
  let interval = card.interval;
  let reps = card.reps;
  let lapses = card.lapses;
  let due = card.due;

  if (rating === "again") {
    ease = Math.max(MIN_EASE, ease - 0.2);
    interval = 0;
    reps = 0;
    lapses += 1;
    due = now + AGAIN_DELAY_MS;
  }

  if (rating === "hard") {
    ease = Math.max(MIN_EASE, ease - 0.15);
    interval = reps === 0 ? 1 : Math.max(1, Math.round(interval * 1.2));
    reps += 1;
    due = now + interval * DAY_MS;
  }

  if (rating === "good") {
    if (reps === 0) {
      interval = 3;
    } else if (reps === 1) {
      interval = Math.max(3, Math.round(interval * ease));
    } else {
      interval = Math.max(1, Math.round(interval * ease));
    }
    reps += 1;
    due = now + interval * DAY_MS;
  }

  if (rating === "easy") {
    ease += 0.15;
    interval = reps === 0 ? 7 : Math.max(1, Math.round(interval * ease * 1.3));
    reps += 1;
    due = now + interval * DAY_MS;
  }

  const nextCard = {
    ...card,
    ease,
    interval,
    reps,
    lapses,
    due,
    state:
      rating === "again" ? "learning" : interval >= 21 ? "graduated" : "due",
    lastReviewed: now,
    againCount: card.againCount + (rating === "again" ? 1 : 0),
    hardCount: card.hardCount + (rating === "hard" ? 1 : 0),
    goodCount: card.goodCount + (rating === "good" ? 1 : 0),
    easyCount: card.easyCount + (rating === "easy" ? 1 : 0),
  } satisfies Flashcard;

  return {
    card: nextCard,
    log: {
      cardId: card.id,
      rating,
      at: now,
      intervalAfter: interval,
    },
  };
}

export function isWeakCard(card: Flashcard) {
  const total =
    card.againCount + card.hardCount + card.goodCount + card.easyCount;

  if (total === 0) return false;

  return (
    (card.againCount + card.hardCount) / total >= 0.4 || card.againCount >= 2
  );
}

export function getLatestRating(cardId: string, logs: ReviewLog[]) {
  for (let index = logs.length - 1; index >= 0; index -= 1) {
    const log = logs[index];
    if (log.cardId === cardId) return log.rating;
  }

  return null;
}

export function getTodayAgainCardIds(logs: ReviewLog[], now = Date.now()) {
  const today = new Date(now).toDateString();
  const latestTodayByCard = new Map<string, Rating>();

  logs.forEach((log) => {
    if (new Date(log.at).toDateString() === today) {
      latestTodayByCard.set(log.cardId, log.rating);
    }
  });

  return [...latestTodayByCard.entries()]
    .filter(([, rating]) => rating === "again")
    .map(([cardId]) => cardId);
}

export function getReviewStreak(logs: ReviewLog[], now = Date.now()) {
  const reviewedDays = new Set(
    logs.map((log) => new Date(log.at).toDateString()),
  );
  let streak = 0;
  const cursor = new Date(now);

  while (reviewedDays.has(cursor.toDateString())) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

export function isDue(card: Flashcard, now = Date.now()) {
  return card.due <= now;
}
