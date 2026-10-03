import type { CbtExamQuestion } from "./cbt";

export type ReviewSource = "CBT" | "HANDCRAFTED" | "AI";
export type ReviewMode = "all" | "wrong" | "bookmarked";

export const REVIEW_MODE_LABELS: Record<ReviewMode, string> = {
  all: "전체 문제 복습",
  wrong: "오답 문제 복습",
  bookmarked: "북마크 문제 복습",
};

export const REVIEW_SOURCE_LABELS: Record<ReviewSource, string> = {
  CBT: "CBT",
  HANDCRAFTED: "수제 제작 문제",
  AI: "AI 생성 문제",
};

export interface LocalReviewQuestion {
  id: string;
  prompt: string;
  subject: string;
  topic: string;
  choices: string[];
  correctChoice: number;
  selectedChoice: number | null;
  status: "correct" | "incorrect" | "unanswered" | "unattempted";
  unknown: boolean;
  bookmarked: boolean;
  explanation: string;
  memo?: string;
  conceptTags?: string[];
  choiceExplanations?: string[];
  media?: CbtExamQuestion["media"];
}

export interface LocalReviewCollection {
  id: string;
  source: Exclude<ReviewSource, "AI">;
  title: string;
  subject: string;
  totalQuestionCount: number;
  updatedAt: string;
  questions: LocalReviewQuestion[];
}
