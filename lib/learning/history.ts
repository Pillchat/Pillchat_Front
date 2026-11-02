import type { ReviewSource } from "@/types/review";
import { dashboardAttemptHref } from "./dashboard";
export const HISTORY_FILTERS = {
  all: "전체",
  correct: "맞음",
  wrong: "오답",
  confused: "헷갈림",
} as const;
export type HistoryFilter = keyof typeof HISTORY_FILTERS;
export function readHistoryFilter(
  value: string | null | undefined,
): HistoryFilter {
  return value === "correct" || value === "wrong" || value === "confused"
    ? value
    : "all";
}
export function historyListHref(view: "recent" | "all", filter: HistoryFilter) {
  const path = view === "recent" ? "/learning/recent" : "/learning/history";
  return filter === "all" ? path : `${path}?filter=${filter}`;
}
export function historyReturnHref(value: string | null | undefined) {
  if (!value?.startsWith("/") || value.startsWith("//"))
    return "/learning/history";
  try {
    const url = new URL(value, "https://pillchat.local");
    if (url.origin !== "https://pillchat.local") return "/learning/history";
    if (url.pathname === "/questionbank") return "/questionbank";
    if (
      url.pathname === "/learning/recent" ||
      url.pathname === "/learning/history"
    )
      return historyListHref(
        url.pathname === "/learning/recent" ? "recent" : "all",
        readHistoryFilter(url.searchParams.get("filter")),
      );
  } catch {}
  return "/learning/history";
}
export type HistoryEntry = {
  attemptId: string;
  source: ReviewSource;
  title: string;
  subject: string | null;
  topic: string | null;
  state: "IN_PROGRESS" | "COMPLETED";
  questionCount: number;
  answeredCount: number;
  correctCount: number | null;
  wrongCount: number | null;
  confusedCount: number;
  createdAt: string;
  lastActivityAt: string;
  completedAt: string | null;
};
export type HistoryPage = {
  serverDate: string;
  summary: { solvedCount: number; correctCount: number; weaknessCount: number };
  items: HistoryEntry[];
  nextCursor: string | null;
};
export type HistoryDetail = {
  attempt: HistoryEntry;
  questions: {
    questionId: string;
    subject: string | null;
    topic: string | null;
    content: string;
    referenceContent?: string | null;
    media?: { url: string | null }[];
    choices: { id: string; text: string; explanation: string | null }[];
    outcome: string;
    confused: boolean;
    userAnswer: string | null;
    correctAnswer: string | null;
    explanation: string | null;
  }[];
};
export function historyHref(entry: HistoryEntry, returnTo?: string) {
  if (entry.state === "IN_PROGRESS") return dashboardAttemptHref(entry);
  const path = `/learning/history/${entry.source}/${encodeURIComponent(entry.attemptId)}`;
  return returnTo
    ? `${path}?${new URLSearchParams({ returnTo: historyReturnHref(returnTo) })}`
    : path;
}
export function historyAccuracy(entry: HistoryEntry) {
  return entry.correctCount == null
    ? null
    : entry.questionCount
      ? Math.round((entry.correctCount / entry.questionCount) * 100)
      : 0;
}
