export type CbtSessionId = 1 | 2 | 3 | 4 | "tutorial";

export type CbtLayoutMode = "single" | "double";

export interface CbtHighlightRange {
  start: number;
  end: number;
}

export type CbtHighlightPoint = [x: number, y: number];

export interface CbtHighlightStroke {
  id: string;
  points: CbtHighlightPoint[];
}

export type CbtSubject =
  | "생명약학"
  | "산업약학"
  | "임상·실무약학1"
  | "임상·실무약학2"
  | "보건·의약관계법규"
  | "조작 튜토리얼";

export interface CbtSessionSummary {
  id: CbtSessionId;
  title: string;
  subjectsLabel: string;
  questionCount: number;
  durationSec: number;
  subjectBreakdown: Array<{ subject: CbtSubject; count: number }>;
}

export interface CbtExamQuestion {
  id: string;
  type: "single" | "case" | "multimedia";
  subject: CbtSubject;
  topic: string;
  number: number;
  stem: string;
  choices: string[];
  media: Array<{
    id: string;
    kind: "image" | "audio" | "table";
    title: string;
    description: string;
  }>;
  caseGroupId: string | null;
}

export interface CbtPracticeSet {
  templateId: string;
  title: string;
  session: CbtSessionSummary;
  questions: CbtExamQuestion[];
  disclaimerVersion: string;
}

export interface CbtAnswerSubmission {
  selectedChoice: number | null;
  flagged?: boolean;
  unknown?: boolean;
  memo?: string;
  excludedChoices?: number[];
  highlightRanges?: CbtHighlightRange[];
  highlightStrokes?: CbtHighlightStroke[];
}

export interface CbtReviewQuestion extends CbtExamQuestion {
  selectedChoice: number | null;
  flagged: boolean;
  unknown: boolean;
  memo: string;
  excludedChoices: number[];
  highlightRanges: CbtHighlightRange[];
  highlightStrokes: CbtHighlightStroke[];
  correctChoice: number;
  explanation: string;
  conceptTags: string[];
  status: "correct" | "incorrect" | "unanswered";
}

export interface CbtGradeResult {
  attemptId: string;
  submittedAt: string;
  total: number;
  correct: number;
  incorrect: number;
  unanswered: number;
  score: number;
  scoresBySubject: Array<{
    subject: CbtSubject;
    total: number;
    correct: number;
    score: number;
  }>;
  review: CbtReviewQuestion[];
}
