import type { ReviewMode, ReviewSource } from "@/types/review";

export type ReviewCollection = {
  collectionRef: string;
  source: ReviewSource;
  title: string;
  total: number;
  wrong: number;
  bookmarked: number;
};

export type ReviewCollectionPage = {
  items: ReviewCollection[];
  nextCursor: string | null;
};

export const reviewModeToAPI: Record<ReviewMode, string> = {
  all: "ALL",
  wrong: "WRONG",
  bookmarked: "BOOKMARKED",
};

export function reviewAttemptHref(response: {
  engine: string;
  result?: {
    attempt?: { source: string; attemptId: string };
    sessionId?: string;
  };
}) {
  if (response.engine === "LEARNING") {
    const attempt = response.result?.attempt;
    if (
      attempt?.attemptId &&
      (attempt.source === "CBT" || attempt.source === "HANDCRAFTED")
    )
      return `${attempt.source === "CBT" ? "/learning/cbt" : "/questionbank/handcrafted"}?attempt=${encodeURIComponent(attempt.attemptId)}`;
  }
  if (response.engine === "LEGACY_AI" && response.result?.sessionId)
    return `/learning/ai?session=${encodeURIComponent(response.result.sessionId)}`;
  throw new Error(
    "복습 정보를 확인하지 못했어요. 목록을 새로 불러온 뒤 다시 시도해주세요.",
  );
}
