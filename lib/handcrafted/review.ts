import type { LocalReviewCollection } from "@/types/review";
import type { HandcraftedQuestion } from "./questions";

export function buildHandcraftedReviewCollection(
  record: {
    id: string;
    questionIds: number[];
    answers: Array<{
      questionId: number;
      selected: number | null;
      isCorrect: boolean;
      unknown: boolean;
    }>;
  },
  catalog: HandcraftedQuestion[],
  bookmarks: number[],
): LocalReviewCollection | null {
  if (
    !record.answers.length &&
    !record.questionIds.some((id) => bookmarks.includes(id))
  )
    return null;
  const questions = record.questionIds.flatMap((id) => {
    const question = catalog.find((item) => item.id === id);
    if (!question) return [];
    const answer = record.answers.find((item) => item.questionId === id);
    return [
      {
        id: String(question.id),
        prompt: question.prompt,
        subject: question.topic,
        topic: question.subtopic,
        choices: question.choices,
        correctChoice: question.answer,
        selectedChoice: answer?.selected ?? null,
        status: !answer
          ? ("unattempted" as const)
          : answer.isCorrect
            ? ("correct" as const)
            : answer.selected === null
              ? ("unanswered" as const)
              : ("incorrect" as const),
        unknown: answer?.unknown ?? false,
        bookmarked: bookmarks.includes(id),
        explanation: question.explanation,
        choiceExplanations: question.choiceExplanations,
      },
    ];
  });
  const subjects = [...new Set(questions.map((item) => item.subject))];
  return {
    id: `handcrafted:${record.id}`,
    source: "HANDCRAFTED",
    title: `${subjects.join(" · ")} 수제 제작 문제 모음`,
    subject: subjects.join(" · "),
    totalQuestionCount: questions.length,
    updatedAt: new Date().toISOString(),
    questions,
  };
}
