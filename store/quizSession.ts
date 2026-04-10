import { atom } from "jotai";
import { fetchAPI } from "@/lib/functions";
import type {
  QuizSession,
  QuizQuestion,
  QuestionResult,
  QuestionDraft,
  QuizSourceType,
  ReviewFilter,
} from "@/types/questionbank";

// ===== 선지 ID 매핑 유틸리티 =====
const CHOICE_IDS = ["A", "B", "C", "D", "E"];

/** choices 문자열 배열 → Choice[] 변환 (null-safe) */
export const mapChoices = (choices: string[] | null | undefined) =>
  (choices ?? []).map((text, i) => ({ id: CHOICE_IDS[i], text }));

/** 선지 ID → 선지 텍스트 */
export const choiceIdToText = (
  choiceId: string | null,
  choices: string[],
): string | null => {
  if (!choiceId) return null;
  const index = CHOICE_IDS.indexOf(choiceId);
  return index >= 0 ? choices[index] : null;
};

/** 선지 텍스트 → 선지 ID */
export const textToChoiceId = (
  text: string,
  choices: string[],
): string | null => {
  const index = choices.indexOf(text);
  return index >= 0 ? CHOICE_IDS[index] : null;
};

// ===== 퀴즈 세션 읽기 아톰 =====

export const quizSessionAtom = atom<QuizSession | null>(null);

export const currentQuestionAtom = atom<QuizQuestion | null>((get) => {
  const session = get(quizSessionAtom);
  if (!session) return null;
  return session.questions[session.currentIndex] ?? null;
});

export const totalQuestionsAtom = atom<number>((get) => {
  const session = get(quizSessionAtom);
  return session?.questions.length ?? 0;
});

export const progressLabelAtom = atom<string>((get) => {
  const session = get(quizSessionAtom);
  if (!session) return "";
  return `문제 ${session.currentIndex + 1}/${session.questions.length}`;
});

export const isCurrentBookmarkedAtom = atom<boolean>((get) => {
  const session = get(quizSessionAtom);
  const question = get(currentQuestionAtom);
  if (!session || !question) return false;
  return session.results[question.id]?.isBookmarked ?? false;
});

export const completedResultsAtom = atom<QuestionResult[]>((get) => {
  const session = get(quizSessionAtom);
  if (!session) return [];
  return Object.values(session.results);
});

const isGradedResult = (result?: QuestionResult) =>
  typeof result?.correctAnswer === "string";

const upsertDraftAnswer = (
  session: QuizSession,
  questionId: number,
  draft: QuestionDraft | null,
) => {
  const draftAnswers = { ...session.draftAnswers };

  if (draft) {
    draftAnswers[questionId] = draft;
  } else {
    delete draftAnswers[questionId];
  }

  return draftAnswers;
};

const getQuestionState = (session: QuizSession, question: QuizQuestion) => {
  const result = session.results[question.id];

  if (isGradedResult(result)) {
    if (
      question.questionType === "MULTIPLE_CHOICE" ||
      question.questionType === "TRUE_FALSE"
    ) {
      return {
        selectedChoiceId: result.selectedChoiceId,
        textAnswer: null,
        gradingState: "graded" as const,
      };
    }

    return {
      selectedChoiceId: null,
      textAnswer: result.userAnswer ?? null,
      gradingState: "graded" as const,
    };
  }

  const draft = session.draftAnswers[question.id];

  if (
    question.questionType === "MULTIPLE_CHOICE" ||
    question.questionType === "TRUE_FALSE"
  ) {
    return {
      selectedChoiceId: draft?.selectedChoiceId ?? null,
      textAnswer: null,
      gradingState: draft?.selectedChoiceId ? "answered" : "unanswered",
    } as const;
  }

  const textAnswer = draft?.textAnswer ?? null;

  return {
    selectedChoiceId: null,
    textAnswer,
    gradingState: textAnswer?.trim() ? "answered" : "unanswered",
  } as const;
};

// ===== 퀴즈 세션 액션 아톰 =====

/** 선지 선택 */
export const selectChoiceAtom = atom(
  null,
  (get, set, choiceId: string | null) => {
    const session = get(quizSessionAtom);
    const question = get(currentQuestionAtom);
    if (!session || !question) return;

    set(quizSessionAtom, {
      ...session,
      draftAnswers: upsertDraftAnswer(
        session,
        question.id,
        choiceId ? { selectedChoiceId: choiceId, textAnswer: null } : null,
      ),
      selectedChoiceId: choiceId,
      textAnswer: null,
      gradingState: choiceId ? "answered" : "unanswered",
    });
  },
);

/** 텍스트 답안 입력 (단답형 / 빈칸채우기용) */
export const setTextAnswerAtom = atom(null, (get, set, text: string) => {
  const session = get(quizSessionAtom);
  const question = get(currentQuestionAtom);
  if (!session || !question) return;

  set(quizSessionAtom, {
    ...session,
    draftAnswers: upsertDraftAnswer(
      session,
      question.id,
      text.trim() ? { selectedChoiceId: null, textAnswer: text } : null,
    ),
    selectedChoiceId: null,
    textAnswer: text,
    gradingState: text.trim() ? "answered" : "unanswered",
  });
});

/**
 * 채점 결과 반영 — 서버 응답(SubmitAnswerResponse)을 받아 로컬 상태 업데이트
 */
export const applyGradeResultAtom = atom(
  null,
  (
    get,
    set,
    payload: {
      questionId: number;
      isCorrect: boolean;
      correctAnswer: string;
      explanation: string;
      userAnswer: string;
    },
  ) => {
    const session = get(quizSessionAtom);
    if (!session) return;

    const question = session.questions.find((q) => q.id === payload.questionId);
    if (!question) return;

    // 문제에 정답/해설 정보 업데이트
    const updatedQuestions = session.questions.map((q) =>
      q.id === payload.questionId
        ? {
            ...q,
            correctAnswer: payload.correctAnswer,
            explanation: payload.explanation,
          }
        : q,
    );

    const result: QuestionResult = {
      questionId: payload.questionId,
      selectedChoiceId: session.selectedChoiceId,
      userAnswer: payload.userAnswer,
      isCorrect: payload.isCorrect,
      correctAnswer: payload.correctAnswer,
      explanation: payload.explanation,
      isBookmarked: !payload.isCorrect, // 오답 → 자동 북마크
    };

    set(quizSessionAtom, {
      ...session,
      questions: updatedQuestions,
      draftAnswers: upsertDraftAnswer(session, payload.questionId, null),
      gradingState: "graded",
      results: { ...session.results, [payload.questionId]: result },
    });
  },
);

/** 다음 문제 이동 */
export const nextQuestionAtom = atom(null, (get, set) => {
  const session = get(quizSessionAtom);
  if (!session) return;

  const nextIndex = session.currentIndex + 1;
  const isComplete = nextIndex >= session.questions.length;

  if (isComplete) {
    set(quizSessionAtom, {
      ...session,
      selectedChoiceId: null,
      textAnswer: null,
      gradingState: "unanswered",
      isComplete: true,
    });
    return;
  }

  const nextQuestion = session.questions[nextIndex];

  set(quizSessionAtom, {
    ...session,
    currentIndex: nextIndex,
    ...getQuestionState(session, nextQuestion),
    isComplete: false,
  });
});

export const prevQuestionAtom = atom(null, (get, set) => {
  const session = get(quizSessionAtom);
  if (!session || session.currentIndex <= 0) return;

  const prevIndex = session.currentIndex - 1;
  const prevQuestion = session.questions[prevIndex];

  set(quizSessionAtom, {
    ...session,
    currentIndex: prevIndex,
    ...getQuestionState(session, prevQuestion),
    isComplete: false,
  });
});

/** 북마크 토글 */
export const toggleBookmarkAtom = atom(null, (get, set) => {
  const session = get(quizSessionAtom);
  const question = get(currentQuestionAtom);
  if (!session || !question) return;

  const existing = session.results[question.id];
  const currentBookmark = existing?.isBookmarked ?? false;

  set(quizSessionAtom, {
    ...session,
    results: {
      ...session.results,
      [question.id]: existing
        ? { ...existing, isBookmarked: !currentBookmark }
        : {
            questionId: question.id,
            selectedChoiceId: null,
            userAnswer: null,
            isCorrect: false,
            isBookmarked: !currentBookmark,
          },
    },
  });

  // 서버 동기화 (fire-and-forget)
  fetchAPI("/api/questionbank/bookmarks", "POST", {
    questionId: question.id,
  }).catch(() => {});
});

/** "잘 모르겠어요" — 스킵 처리 + 큐 뒤로 이동 */
export const skipQuestionAtom = atom(null, (get, set) => {
  const session = get(quizSessionAtom);
  const question = get(currentQuestionAtom);
  if (!session || !question) return;

  const result: QuestionResult = {
    questionId: question.id,
    selectedChoiceId: null,
    userAnswer: null,
    isCorrect: false,
    isBookmarked: true,
  };

  const newQuestions = [...session.questions];
  const [removed] = newQuestions.splice(session.currentIndex, 1);
  newQuestions.push(removed);
  const nextResults = { ...session.results, [question.id]: result };
  const nextDraftAnswers = upsertDraftAnswer(session, question.id, null);
  const nextIndex = Math.min(session.currentIndex, newQuestions.length - 1);
  const nextQuestion = newQuestions[nextIndex];
  const nextSession: QuizSession = {
    ...session,
    questions: newQuestions,
    results: nextResults,
    draftAnswers: nextDraftAnswers,
  };

  set(quizSessionAtom, {
    ...nextSession,
    currentIndex: nextIndex,
    ...(nextQuestion
      ? getQuestionState(nextSession, nextQuestion)
      : {
          selectedChoiceId: null,
          textAnswer: null,
          gradingState: "unanswered" as const,
        }),
  });
});

/** 퀴즈 세션 초기화 */
export const initQuizSessionAtom = atom(
  null,
  (
    _get,
    set,
    payload: {
      sessionId: number;
      sourceType: QuizSourceType;
      title: string;
      questions: QuizQuestion[];
    },
  ) => {
    set(quizSessionAtom, {
      ...payload,
      results: {},
      draftAnswers: {},
      currentIndex: 0,
      gradingState: "unanswered",
      selectedChoiceId: null,
      textAnswer: null,
      isComplete: false,
    });
  },
);

/** 퀴즈 세션 리셋 */
export const clearQuizSessionAtom = atom(null, (_get, set) => {
  set(quizSessionAtom, null);
});

// ===== 복습 필터 =====
export const reviewFilterAtom = atom<ReviewFilter>({
  tab: "pdf",
  subject: "all",
  wrongOnly: false,
  bookmarkedOnly: false,
  sortBy: "time",
});
