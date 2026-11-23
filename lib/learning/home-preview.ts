import previewQuestions from "./home-preview-questions.json";

export type PreviewChapter = keyof typeof previewQuestions;

export const previewChapters = Object.keys(
  previewQuestions,
) as PreviewChapter[];

const previewQuestionsById = new Map(
  previewChapters.flatMap((chapter) =>
    previewQuestions[chapter].map(
      (question) => [question.id, { ...question, chapter }] as const,
    ),
  ),
);

export const getPreviewQuestion = (id: string) => previewQuestionsById.get(id);

export type PreviewAttempt = {
  questionIds: string[];
  answers: string[];
  position: number;
};

export type PreviewProgress = {
  studyDate: string;
  chapters: PreviewChapter[];
  submitted: string[];
  attempt: PreviewAttempt | null;
};

export const DAILY_PREVIEW_LIMIT = 3;

export function previewStudyDate(now = Date.now()) {
  return new Date(now + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

export function getPreviewQuestionIds(
  chapters: PreviewChapter[],
  submitted: string[],
  studyDate: string,
) {
  const available = previewChapters
    .filter((chapter) => chapters.includes(chapter))
    .map((chapter) => previewQuestions[chapter]);
  const ids = [0, 1, 2].flatMap((index) =>
    available.flatMap((questions) =>
      questions.slice(index, index + 1).map(({ id }) => id),
    ),
  );
  const day = Math.floor(Date.parse(studyDate) / 86_400_000);
  const offset = day % 2 ? DAILY_PREVIEW_LIMIT : 0;
  return [...ids.slice(offset), ...ids.slice(0, offset)]
    .filter((id) => !submitted.includes(id))
    .slice(0, Math.max(0, DAILY_PREVIEW_LIMIT - new Set(submitted).size));
}

export function submitPreviewAnswer(
  progress: PreviewProgress,
  choiceId: string,
): PreviewProgress {
  const { attempt } = progress;
  if (
    !attempt ||
    attempt.answers.length !== attempt.position ||
    progress.submitted.length >= DAILY_PREVIEW_LIMIT ||
    progress.submitted.includes(attempt.questionIds[attempt.position])
  )
    return progress;

  const question = getPreviewQuestion(attempt.questionIds[attempt.position]);
  if (!question?.choices.some((choice) => choice.id === choiceId))
    return progress;

  return {
    ...progress,
    submitted: Array.from(new Set([...progress.submitted, question.id])),
    attempt: { ...attempt, answers: [...attempt.answers, choiceId] },
  };
}

export function readPreviewProgress(
  raw: string | null,
  today = previewStudyDate(),
): PreviewProgress {
  const initial: PreviewProgress = {
    studyDate: today,
    chapters: previewChapters,
    submitted: [],
    attempt: null,
  };
  try {
    const progress = JSON.parse(raw ?? "null") as PreviewProgress | null;
    if (
      !progress ||
      !Array.isArray(progress.chapters) ||
      !progress.chapters.length ||
      new Set(progress.chapters).size !== progress.chapters.length ||
      !progress.chapters.every((chapter) => previewChapters.includes(chapter))
    )
      return initial;
    if (
      progress.studyDate !== today ||
      !Array.isArray(progress.submitted) ||
      progress.submitted.length > DAILY_PREVIEW_LIMIT ||
      new Set(progress.submitted).size !== progress.submitted.length ||
      !progress.submitted.every((id) => previewQuestionsById.has(id))
    ) {
      return { ...initial, chapters: progress.chapters };
    }

    const { attempt } = progress;
    if (attempt === null) return progress;
    if (
      !attempt ||
      !Array.isArray(attempt.questionIds) ||
      !attempt.questionIds.length ||
      attempt.questionIds.length > DAILY_PREVIEW_LIMIT ||
      new Set(attempt.questionIds).size !== attempt.questionIds.length ||
      !attempt.questionIds.every((id) => {
        const question = getPreviewQuestion(id);
        return question && progress.chapters.includes(question.chapter);
      }) ||
      !Array.isArray(attempt.answers) ||
      attempt.questionIds
        .slice(attempt.answers.length)
        .some((id) => progress.submitted.includes(id)) ||
      progress.submitted.length +
        attempt.questionIds.length -
        attempt.answers.length >
        DAILY_PREVIEW_LIMIT ||
      !Number.isInteger(attempt.position) ||
      attempt.position < 0 ||
      attempt.position > attempt.questionIds.length ||
      attempt.answers.length > attempt.questionIds.length ||
      ![attempt.position, attempt.position + 1].includes(
        attempt.answers.length,
      ) ||
      !attempt.answers.every((choiceId, index) => {
        const id = attempt.questionIds[index];
        return (
          progress.submitted.includes(id) &&
          getPreviewQuestion(id)?.choices.some(
            (choice) => choice.id === choiceId,
          )
        );
      })
    ) {
      return { ...progress, attempt: null };
    }

    return {
      ...progress,
      attempt: { ...attempt, position: attempt.answers.length },
    };
  } catch {
    return initial;
  }
}
