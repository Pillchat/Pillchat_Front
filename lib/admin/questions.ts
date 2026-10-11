import type {
  AdminQuestionDraft,
  AdminQuestionSetDraft,
} from "@/types/adminQuestion";

export const MAX_QUESTIONS = 100;
export const MAX_CHOICES = 5;
export const MAX_IMPORT_BYTES = 5 * 1024 * 1024;

export function createQuestion(): AdminQuestionDraft {
  return {
    id: crypto.randomUUID(),
    subject: "",
    topic: "",
    subtopic: "",
    prompt: "",
    referenceContent: "",
    choices: Array.from({ length: MAX_CHOICES }, () => ({
      id: crypto.randomUUID(),
      text: "",
      explanation: "",
    })),
    correctChoiceId: "",
    explanation: "",
    isActive: true,
  };
}

export function createQuestionSet(): AdminQuestionSetDraft {
  return {
    version: 1,
    title: "",
    kind: "HANDCRAFTED",
    sessionId: 1,
    durationMinutes: 90,
    isActive: true,
    questions: [createQuestion()],
  };
}

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("문제 파일의 형식이 올바르지 않습니다.");
  }
  return value as Record<string, unknown>;
}

function text(value: Record<string, unknown>, key: string, max: number) {
  if (typeof value[key] !== "string" || value[key].length > max) {
    throw new Error(`문제 파일의 ${key} 항목을 확인해주세요.`);
  }
  return value[key] as string;
}

function active(value: Record<string, unknown>) {
  if (typeof value.isActive !== "boolean") {
    throw new Error("문제 파일의 활성 상태를 확인해주세요.");
  }
  return value.isActive;
}

function uniqueIds(values: { id: string }[]) {
  if (
    values.some((item) => !item.id.trim()) ||
    new Set(values.map((item) => item.id)).size !== values.length
  ) {
    throw new Error("문제와 보기의 ID는 비어 있거나 중복될 수 없습니다.");
  }
}

// Incomplete drafts are allowed here; export and upload use validateQuestionSet.
export function parseQuestionSet(value: unknown): AdminQuestionSetDraft {
  const set = record(value);
  if (
    set.version !== 1 ||
    (set.kind !== "HANDCRAFTED" && set.kind !== "CBT") ||
    ![1, 2, 3, 4].includes(set.sessionId as number) ||
    !Number.isInteger(set.durationMinutes) ||
    (set.durationMinutes as number) < 1 ||
    (set.durationMinutes as number) > 240 ||
    !Array.isArray(set.questions) ||
    set.questions.length < 1 ||
    set.questions.length > MAX_QUESTIONS
  ) {
    throw new Error(
      "문제 세트의 종류, 교시, 시간 또는 문제 수를 확인해주세요.",
    );
  }
  const questions = set.questions.map((item): AdminQuestionDraft => {
    const question = record(item);
    if (
      !Array.isArray(question.choices) ||
      question.choices.length < 2 ||
      question.choices.length > MAX_CHOICES
    ) {
      throw new Error("보기는 문제당 2~5개여야 합니다.");
    }
    const choices = question.choices.map((item) => {
      const choice = record(item);
      return {
        id: text(choice, "id", 100),
        text: text(choice, "text", 2000),
        explanation: text(choice, "explanation", 10000),
      };
    });
    uniqueIds(choices);
    const correctChoiceId = text(question, "correctChoiceId", 100);
    if (
      correctChoiceId &&
      !choices.some((item) => item.id === correctChoiceId)
    ) {
      throw new Error("정답으로 지정한 보기가 문제에 없습니다.");
    }
    return {
      id: text(question, "id", 100),
      subject: text(question, "subject", 100),
      topic: text(question, "topic", 100),
      subtopic: text(question, "subtopic", 100),
      prompt: text(question, "prompt", 10000),
      referenceContent: text(question, "referenceContent", 10000),
      choices,
      correctChoiceId,
      explanation: text(question, "explanation", 10000),
      isActive: active(question),
    };
  });
  uniqueIds(questions);
  return {
    version: 1,
    title: text(set, "title", 100),
    kind: set.kind,
    sessionId: set.sessionId as AdminQuestionSetDraft["sessionId"],
    durationMinutes: set.durationMinutes as number,
    isActive: active(set),
    questions,
  };
}

export function validateQuestionSet(
  value: AdminQuestionSetDraft,
): string | null {
  let set: AdminQuestionSetDraft;
  try {
    set = parseQuestionSet(value);
  } catch (error) {
    return error instanceof Error ? error.message : "문제 세트를 확인해주세요.";
  }
  if (!set.title.trim()) return "문제 세트명을 입력해주세요.";
  if (set.isActive && !set.questions.some((question) => question.isActive)) {
    return "활성 세트에는 활성 문제가 한 개 이상 필요합니다.";
  }
  for (const [index, question] of set.questions.entries()) {
    const prefix = `${index + 1}번 문제: `;
    if (!question.subject.trim() || !question.topic.trim()) {
      return prefix + "과목과 주제를 입력해주세요.";
    }
    if (!question.prompt.trim()) return prefix + "문제 본문을 입력해주세요.";
    if (question.choices.some((choice) => !choice.text.trim())) {
      return prefix + "모든 보기의 내용을 입력해주세요.";
    }
    if (
      new Set(question.choices.map((choice) => choice.text.trim())).size !==
      question.choices.length
    ) {
      return prefix + "보기의 내용이 중복됩니다.";
    }
    if (!question.correctChoiceId) return prefix + "정답을 선택해주세요.";
    if (!question.explanation.trim())
      return prefix + "문제 해설을 입력해주세요.";
    if (question.choices.some((choice) => !choice.explanation.trim())) {
      return prefix + "모든 보기의 해설을 입력해주세요.";
    }
  }
  return null;
}

export function normalizeQuestionSet(
  value: AdminQuestionSetDraft,
): AdminQuestionSetDraft {
  const set = parseQuestionSet(value);
  return {
    ...set,
    title: set.title.trim(),
    questions: set.questions.map((question) => ({
      ...question,
      subject: question.subject.trim(),
      topic: question.topic.trim(),
      subtopic: question.subtopic.trim(),
      prompt: question.prompt.trim(),
      referenceContent: question.referenceContent.trim(),
      explanation: question.explanation.trim(),
      choices: question.choices.map((choice) => ({
        ...choice,
        text: choice.text.trim(),
        explanation: choice.explanation.trim(),
      })),
    })),
  };
}
