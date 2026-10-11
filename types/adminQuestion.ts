export type AdminQuestionKind = "HANDCRAFTED" | "CBT";

export type AdminQuestionChoice = {
  id: string;
  text: string;
  explanation: string;
};

export type AdminQuestionDraft = {
  id: string;
  subject: string;
  topic: string;
  subtopic: string;
  prompt: string;
  referenceContent: string;
  choices: AdminQuestionChoice[];
  correctChoiceId: string;
  explanation: string;
  isActive: boolean;
};

export type AdminQuestionSetDraft = {
  version: 1;
  title: string;
  kind: AdminQuestionKind;
  sessionId: 1 | 2 | 3 | 4;
  durationMinutes: number;
  isActive: boolean;
  questions: AdminQuestionDraft[];
};
