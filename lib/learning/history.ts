import type { ReviewSource } from "@/types/review";
import { dashboardAttemptHref } from "./dashboard";
export const HISTORY_FILTERS = {
  all: "전체",
  correct: "맞음",
  wrong: "오답",
  confused: "헷갈림",
} as const;
export type HistoryFilter = keyof typeof HISTORY_FILTERS;
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
export function historyHref(entry: HistoryEntry) {
  return entry.state === "IN_PROGRESS"
    ? dashboardAttemptHref(entry)
    : `/learning/history/${entry.source}/${encodeURIComponent(entry.attemptId)}`;
}
export function historyAccuracy(entry: HistoryEntry) {
  return entry.correctCount == null
    ? null
    : entry.questionCount
      ? Math.round((entry.correctCount / entry.questionCount) * 100)
      : 0;
}
