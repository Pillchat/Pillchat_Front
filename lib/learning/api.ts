import { ApiError, fetchAPI } from "@/lib/client/fetch";
export type Source = "HANDCRAFTED" | "CBT";
export type Question = {
  attemptQuestionId: string;
  sourceQuestionVersionId: string;
  ordinal: number;
  stem: string;
  referenceContent?: string;
  subjectName: string;
  choices: { choiceId: string; text: string }[];
  media: { url?: string; downloadUrl?: string; alt?: string }[];
};
export type SavedAnswer = {
  attemptQuestionId: string;
  selectedChoiceId: string | null;
  memo: string;
  flagged: boolean;
  excludedChoiceIds: string[];
  version: number;
  finalized: boolean;
};
export type Section = {
  sectionId: string;
  title: string;
  state: string;
  version: number;
  scheduledStartAt: string | null;
  deadlineAt: string | null;
};
export type Attempt = {
  attemptId: string;
  source: Source;
  mode: string;
  state: string;
  title: string;
  currentSectionId: string;
  currentQuestionId: string;
  serverNow: string;
  resultAvailable: boolean;
  sections: Section[];
  currentSectionQuestions: Question[];
  savedAnswers: SavedAnswer[];
};
export type Grade = {
  outcome: string;
  correctChoiceId: string;
  explanation: string;
  choices: { choiceId: string; text: string; explanation: string }[];
};
export type Command = { attempt: Attempt; grade?: Grade };
export type Result = {
  counts: {
    total: number;
    correct: number;
    incorrect: number;
    unanswered: number;
  };
  score: number;
  questions: { question: Question; answer: SavedAnswer; grade: Grade }[];
};
export type Catalog = {
  banks: {
    bankId: string;
    revisionId: string;
    title: string;
    sections: {
      ordinal: number;
      title: string;
      available: boolean;
      questionCount: number;
      durationSec: number | null;
    }[];
  }[];
  subjects: {
    subjectId: string;
    name: string;
    availableCount: number;
    sourceRevisions: { bankId: string; revisionId: string }[];
    topics: { topicId: string; name: string; availableCount: number }[];
  }[];
};

/** Retains an uncertain command verbatim until explicitly retried successfully. */
export class LearningCommands {
  pending: {
    url: string;
    method: string;
    body: Record<string, unknown>;
  } | null = null;
  async send<T>(
    url: string,
    method: string,
    body: Record<string, unknown>,
  ): Promise<T> {
    if (this.pending)
      throw new Error("이전 요청의 결과를 먼저 확인하거나 다시 전송해주세요.");
    this.pending = {
      url,
      method,
      body: { ...body, idempotencyKey: crypto.randomUUID() },
    };
    return this.retry<T>();
  }
  async retry<T>(): Promise<T> {
    if (!this.pending) throw new Error("재시도할 요청이 없습니다.");
    const { url, method, body } = this.pending;
    try {
      const result = await fetchAPI(url, method, body);
      this.pending = null;
      return result;
    } catch (error) {
      if (error instanceof ApiError && error.status < 500) this.pending = null;
      throw error;
    }
  }
}
