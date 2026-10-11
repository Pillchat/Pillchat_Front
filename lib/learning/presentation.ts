import type { Attempt, Question, SavedAnswer } from "./api";
import type {
  AnswerState,
  CbtDisplayQuestion,
} from "@/components/learning/practice/CbtPresentation";

export const attemptIndex = (attempt: Attempt) =>
  Math.max(
    0,
    attempt.currentSectionQuestions.findIndex(
      (q) => q.attemptQuestionId === attempt.currentQuestionId,
    ),
  );
export function cbtQuestion(
  question: Question,
  index: number,
): CbtDisplayQuestion {
  return {
    id: question.attemptQuestionId,
    type: question.referenceContent
      ? "case"
      : question.media?.length
        ? "multimedia"
        : "single",
    subject: question.subjectName,
    practiceLabel: null,
    topic: "",
    number: index + 1,
    stem: question.stem,
    referenceContent: question.referenceContent,
    choices: question.choices.map((c) => c.text),
    caseGroupId: null,
    media: (question.media ?? [])
      .filter((m) => m.url || m.downloadUrl)
      .map((m, i) => ({
        id: `${question.attemptQuestionId}-${i}`,
        kind: "image",
        title: m.alt ?? "문항 자료",
        description: "",
        url: m.url ?? m.downloadUrl,
      })),
  };
}
export function cbtAnswer(
  question: Question,
  answer?: SavedAnswer,
  memo?: string,
): AnswerState {
  const selected = question.choices.findIndex(
    (c) => c.choiceId === answer?.selectedChoiceId,
  );
  return {
    selectedChoice: selected < 0 ? null : selected,
    flagged: answer?.flagged ?? false,
    unknown: false,
    memo: memo ?? answer?.memo ?? "",
    excludedChoices: question.choices.flatMap((c, index) =>
      answer?.excludedChoiceIds.includes(c.choiceId) ? [index] : [],
    ),
    revision: answer?.version ?? 0,
    updatedAt: "",
  };
}
export function choicePatch(
  question: Question,
  patch: Partial<AnswerState>,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  if ("selectedChoice" in patch) {
    if (patch.selectedChoice === null) result.selectedChoiceId = null;
    else {
      const choice = question.choices[patch.selectedChoice!];
      if (!choice) throw new Error("선택지를 확인해주세요.");
      result.selectedChoiceId = choice.choiceId;
    }
  }
  if (patch.excludedChoices)
    result.excludedChoiceIds = patch.excludedChoices.map((index) => {
      const choice = question.choices[index];
      if (!choice) throw new Error("선택지를 확인해주세요.");
      return choice.choiceId;
    });
  if ("flagged" in patch) result.flagged = patch.flagged;
  if ("memo" in patch) result.memo = patch.memo;
  return result;
}
export function answerUpdates(
  attempt: Attempt,
  memos: Record<string, string>,
  questionId?: string,
  patch: Record<string, unknown> = {},
) {
  return attempt.savedAnswers
    .filter(
      (a) =>
        !a.finalized &&
        (a.attemptQuestionId === questionId ||
          (a.attemptQuestionId in memos &&
            memos[a.attemptQuestionId] !== a.memo)),
    )
    .map((a) => ({
      attemptQuestionId: a.attemptQuestionId,
      expectedVersion: a.version,
      ...(a.attemptQuestionId in memos
        ? { memo: memos[a.attemptQuestionId] }
        : {}),
      ...(a.attemptQuestionId === questionId ? patch : {}),
    }));
}
export function secondsRemaining(
  attempt: Attempt,
  now: number,
  clockOffset: number,
): number | null {
  const section = attempt.sections.find(
    (s) => s.sectionId === attempt.currentSectionId,
  );
  const date =
    attempt.state === "BREAK" ? section?.scheduledStartAt : section?.deadlineAt;
  if (!date || !Number.isFinite(Date.parse(date))) return null;
  return Math.max(0, Math.ceil((Date.parse(date) - now - clockOffset) / 1000));
}
export const formatDuration = (seconds: number | null) =>
  seconds == null
    ? "시간 제한 없음"
    : `${Math.floor(seconds / 60)}분 ${seconds % 60}초`;
