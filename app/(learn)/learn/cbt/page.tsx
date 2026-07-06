"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Calculator,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eraser,
  FileText,
  Flag,
  Highlighter,
  HelpCircle,
  LayoutPanelLeft,
  ListChecks,
  Maximize2,
  RotateCcw,
  StickyNote,
  X,
} from "lucide-react";

import { cn } from "@/lib/utils";

type SessionId = 1 | 2 | 3 | 4;
type FontScale = "base" | "large" | "xlarge";
type LayoutMode = "single" | "split";
type CbtMode = "full" | "session" | "review";
type CbtStage = "hub" | "session-select" | "review-empty" | "player";

type Subject =
  | "생명약학"
  | "산업약학"
  | "임상·실무약학1"
  | "임상·실무약학2"
  | "보건·의약관계법규";

type SessionMeta = {
  id: SessionId;
  name: string;
  title: string;
  subjectsLabel: string;
  total: number;
  durationMin: number;
  startTime: string;
  endTime: string;
  subjects: Array<{ subject: Subject; count: number }>;
};

type CbtQuestion = {
  id: string;
  sessionId: SessionId;
  subject: Subject;
  topic: string;
  numberInSession: number;
  stem: string;
  choices: string[];
  answer: number;
  explanation: string;
};

type AnswerState = {
  selected: number | null;
  flagged: boolean;
  unknown: boolean;
  reviewed: boolean;
};

const CBT_MISSED_STORAGE_KEY = "yakchat:cbt-missed-question-ids";

const SESSIONS: SessionMeta[] = [
  {
    id: 1,
    name: "1교시",
    title: "1교시 생명약학",
    subjectsLabel: "생명약학",
    total: 100,
    durationMin: 90,
    startTime: "09:00",
    endTime: "10:30",
    subjects: [{ subject: "생명약학", count: 100 }],
  },
  {
    id: 2,
    name: "2교시",
    title: "2교시 산업약학",
    subjectsLabel: "산업약학",
    total: 90,
    durationMin: 85,
    startTime: "11:05",
    endTime: "12:30",
    subjects: [{ subject: "산업약학", count: 90 }],
  },
  {
    id: 3,
    name: "3교시",
    title: "3교시 임상·실무약학1",
    subjectsLabel: "임상·실무약학1",
    total: 77,
    durationMin: 75,
    startTime: "13:40",
    endTime: "14:55",
    subjects: [{ subject: "임상·실무약학1", count: 77 }],
  },
  {
    id: 4,
    name: "4교시",
    title: "4교시 임상·실무약학2 + 보건·의약관계법규",
    subjectsLabel: "임상·실무약학2 + 보건·의약관계법규",
    total: 83,
    durationMin: 75,
    startTime: "15:30",
    endTime: "16:45",
    subjects: [
      { subject: "임상·실무약학2", count: 63 },
      { subject: "보건·의약관계법규", count: 20 },
    ],
  },
];

const TOPICS: Record<Subject, string[]> = {
  생명약학: [
    "생화학",
    "미생물학",
    "생리학",
    "병태생리학",
    "약리학 기초",
    "면역학",
    "분자생물학",
  ],
  산업약학: [
    "물리약학",
    "약제학",
    "제제공학",
    "생약학",
    "의약품분석학",
    "의약화학",
    "약품합성학",
  ],
  "임상·실무약학1": [
    "약물치료학",
    "임상약동학",
    "TDM",
    "임상검사치",
    "복약지도",
    "환자 케이스",
  ],
  "임상·실무약학2": ["약국실무", "처방검토", "DUR", "의약품정보", "환자 상담"],
  "보건·의약관계법규": [
    "약사법",
    "마약류관리법",
    "국민건강증진법",
    "보건의료기본법",
    "국민건강보험법",
    "지역보건법",
  ],
};

const CHOICE_LABELS = ["1", "2", "3", "4", "5"];
const FONT_OPTIONS: Array<{
  value: FontScale;
  label: string;
  className: string;
}> = [
  { value: "base", label: "가", className: "text-xs" },
  { value: "large", label: "가", className: "text-sm" },
  { value: "xlarge", label: "가", className: "text-base" },
];

const formatMMSS = (totalSec: number) => {
  const safe = Math.max(0, totalSec);
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
    2,
    "0",
  )}`;
};

const getSession = (id: SessionId) => SESSIONS.find((item) => item.id === id)!;

const pickTopic = (subject: Subject, index: number) => {
  const list = TOPICS[subject];
  return list[index % list.length];
};

const buildQuestion = (
  sessionId: SessionId,
  subject: Subject,
  numberInSession: number,
  globalIndex: number,
): CbtQuestion => {
  const topic = pickTopic(subject, globalIndex);
  const answer = globalIndex % 5;
  const id = `S${sessionId}-${String(numberInSession).padStart(3, "0")}`;
  const stems = [
    `다음 중 ${topic}의 기본 개념으로 가장 적절한 것은?`,
    `${topic}와 관련하여 옳은 설명을 고르시오.`,
    `${topic}에 대한 설명으로 가장 알맞은 것은?`,
    `${topic}의 임상적 의의로 가장 타당한 것은?`,
    `${topic} 분야에서 우선 확인해야 할 사항은?`,
  ];
  const correctChoice = `${topic}의 핵심 원리를 정확히 반영한 설명이다.`;
  const distractors = [
    `${topic}와 무관한 개념을 적용한 설명이다.`,
    `${topic}의 정의를 반대로 해석한 설명이다.`,
    `${topic}의 일부 사례만 일반화한 설명이다.`,
    `${topic}와 다른 과목의 개념을 혼동한 설명이다.`,
    `${topic}의 예외 조건을 누락한 설명이다.`,
  ];
  const choices = Array.from({ length: 5 }, (_, index) =>
    index === answer ? correctChoice : distractors[index % distractors.length],
  );

  return {
    id,
    sessionId,
    subject,
    topic,
    numberInSession,
    stem: `[모의 문항] ${stems[globalIndex % stems.length]}`,
    choices,
    answer,
    explanation:
      `${topic}에서는 핵심 정의와 적용 조건을 먼저 확인해야 합니다. ` +
      `정답 보기는 해당 원리를 직접 반영하고, 나머지 보기는 범위 또는 전제를 혼동한 표현입니다.`,
  };
};

const QUESTIONS_BY_SESSION: Record<SessionId, CbtQuestion[]> = (() => {
  const grouped = {
    1: [] as CbtQuestion[],
    2: [] as CbtQuestion[],
    3: [] as CbtQuestion[],
    4: [] as CbtQuestion[],
  };
  let globalIndex = 0;

  for (const session of SESSIONS) {
    let numberInSession = 1;
    for (const subject of session.subjects) {
      for (let index = 0; index < subject.count; index += 1) {
        grouped[session.id].push(
          buildQuestion(
            session.id,
            subject.subject,
            numberInSession,
            globalIndex,
          ),
        );
        numberInSession += 1;
        globalIndex += 1;
      }
    }
  }

  return grouped;
})();

const ALL_QUESTIONS = SESSIONS.flatMap(
  (session) => QUESTIONS_BY_SESSION[session.id],
);
const QUESTION_BY_ID = new Map(
  ALL_QUESTIONS.map((question) => [question.id, question]),
);
const TOTAL_MINUTES = SESSIONS.reduce(
  (total, session) => total + session.durationMin,
  0,
);

const createAnswers = (questions: CbtQuestion[]) =>
  Object.fromEntries(
    questions.map((question) => [
      question.id,
      {
        selected: null,
        flagged: false,
        unknown: false,
        reviewed: false,
      } satisfies AnswerState,
    ]),
  ) as Record<string, AnswerState>;

const getStemClass = (fontScale: FontScale) =>
  fontScale === "xlarge"
    ? "text-[1.375rem] leading-10"
    : fontScale === "large"
      ? "text-[1.1875rem] leading-9"
      : "text-[1.0625rem] leading-8";

const getChoiceClass = (fontScale: FontScale) =>
  fontScale === "xlarge"
    ? "text-lg leading-8"
    : fontScale === "large"
      ? "text-base leading-7"
      : "text-[0.9375rem] leading-6";

const loadMissedQuestionIds = () => {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(CBT_MISSED_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];

    return parsed.filter(
      (id): id is string => typeof id === "string" && QUESTION_BY_ID.has(id),
    );
  } catch {
    return [];
  }
};

const saveMissedQuestionIds = (ids: string[]) => {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(CBT_MISSED_STORAGE_KEY, JSON.stringify(ids));
};

export default function LearnCbtPage() {
  const [stage, setStage] = useState<CbtStage>("hub");
  const [mode, setMode] = useState<CbtMode>("session");
  const [sessionId, setSessionId] = useState<SessionId>(1);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState(() =>
    createAnswers(QUESTIONS_BY_SESSION[1]),
  );
  const [questions, setQuestions] = useState<CbtQuestion[]>(
    QUESTIONS_BY_SESSION[1],
  );
  const [runTitle, setRunTitle] = useState("1교시 생명약학 문항풀이");
  const [runSubtitle, setRunSubtitle] = useState("09:00-10:30 · 100문항");
  const [durationMin, setDurationMin] = useState(90);
  const [missedQuestionIds, setMissedQuestionIds] = useState<string[]>([]);
  const [startedAt, setStartedAt] = useState(() => Date.now());
  const [now, setNow] = useState(() => Date.now());
  const [fontScale, setFontScale] = useState<FontScale>("base");
  const [layoutMode, setLayoutMode] = useState<LayoutMode>("single");
  const [highlightOn, setHighlightOn] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [calculatorOpen, setCalculatorOpen] = useState(false);
  const [submitOpen, setSubmitOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const currentQuestion = questions[questionIndex];
  const currentAnswer = currentQuestion
    ? (answers[currentQuestion.id] ?? {
        selected: null,
        flagged: false,
        unknown: false,
        reviewed: false,
      })
    : {
        selected: null,
        flagged: false,
        unknown: false,
        reviewed: false,
      };
  const deadline = startedAt + durationMin * 60 * 1000;
  const elapsedSec = Math.max(0, Math.floor((now - startedAt) / 1000));
  const remainingSec = Math.max(0, Math.floor((deadline - now) / 1000));
  const lowTime = remainingSec <= 300;

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    setMissedQuestionIds(loadMissedQuestionIds());
  }, []);

  useEffect(() => {
    if (
      stage === "player" &&
      mode !== "review" &&
      !submitted &&
      remainingSec === 0
    ) {
      setSubmitted(true);
      setSubmitOpen(false);
    }
  }, [mode, remainingSec, stage, submitted]);

  const summary = useMemo(() => {
    let answered = 0;
    let flagged = 0;
    let unknown = 0;
    let correct = 0;

    for (const question of questions) {
      const answer = answers[question.id];
      if (answer?.selected !== null && answer?.selected !== undefined) {
        answered += 1;
      }
      if (answer?.flagged) flagged += 1;
      if (answer?.unknown) unknown += 1;
      if (answer?.selected === question.answer) correct += 1;
    }

    return {
      answered,
      unanswered: questions.length - answered,
      flagged,
      unknown,
      correct,
      accuracy: questions.length
        ? Math.round((correct / questions.length) * 100)
        : 0,
    };
  }, [answers, questions]);

  const beginRun = ({
    nextMode,
    nextSessionId,
    nextQuestions,
    title,
    subtitle,
    nextDurationMin,
  }: {
    nextMode: CbtMode;
    nextSessionId: SessionId;
    nextQuestions: CbtQuestion[];
    title: string;
    subtitle: string;
    nextDurationMin: number;
  }) => {
    setMode(nextMode);
    setSessionId(nextSessionId);
    setQuestions(nextQuestions);
    setRunTitle(title);
    setRunSubtitle(subtitle);
    setDurationMin(nextDurationMin);
    setQuestionIndex(0);
    setAnswers(createAnswers(nextQuestions));
    setStartedAt(Date.now());
    setNow(Date.now());
    setSubmitted(false);
    setSubmitOpen(false);
    setHighlightOn(false);
    setNoteOpen(false);
    setStage("player");
  };

  const beginFullRun = () => {
    beginRun({
      nextMode: "full",
      nextSessionId: 1,
      nextQuestions: ALL_QUESTIONS,
      title: "전체 실전 모의고사",
      subtitle: `4교시 전체 · ${ALL_QUESTIONS.length}문항 · ${TOTAL_MINUTES}분`,
      nextDurationMin: TOTAL_MINUTES,
    });
  };

  const beginSessionRun = (nextSessionId: SessionId) => {
    const nextSession = getSession(nextSessionId);
    beginRun({
      nextMode: "session",
      nextSessionId,
      nextQuestions: QUESTIONS_BY_SESSION[nextSessionId],
      title: `${nextSession.name} ${nextSession.subjectsLabel} 문항풀이`,
      subtitle: `${nextSession.startTime}-${nextSession.endTime} · ${nextSession.total}문항`,
      nextDurationMin: nextSession.durationMin,
    });
  };

  const beginReviewRun = () => {
    const latestMissedIds = loadMissedQuestionIds();
    const reviewQuestions = latestMissedIds
      .map((id) => QUESTION_BY_ID.get(id))
      .filter((question): question is CbtQuestion => Boolean(question));

    setMissedQuestionIds(latestMissedIds);

    if (reviewQuestions.length === 0) {
      setStage("review-empty");
      return;
    }

    beginRun({
      nextMode: "review",
      nextSessionId: reviewQuestions[0].sessionId,
      nextQuestions: reviewQuestions,
      title: "오답 복습",
      subtitle: `최근 틀렸거나 안 푼 문제 · ${reviewQuestions.length}문항`,
      nextDurationMin: Math.max(10, Math.ceil(reviewQuestions.length * 1.2)),
    });
  };

  const resetCurrentRun = () => {
    setQuestionIndex(0);
    setAnswers(createAnswers(questions));
    setStartedAt(Date.now());
    setNow(Date.now());
    setSubmitted(false);
    setSubmitOpen(false);
    setHighlightOn(false);
    setNoteOpen(false);
  };

  const returnToHub = () => {
    setStage("hub");
    setSubmitOpen(false);
    setCalculatorOpen(false);
  };

  const updateAnswer = (questionId: string, next: Partial<AnswerState>) => {
    setAnswers((current) => ({
      ...current,
      [questionId]: {
        ...current[questionId],
        ...next,
      },
    }));
  };

  const answerQuestion = (choiceIndex: number) => {
    if (submitted || !currentQuestion) return;
    updateAnswer(currentQuestion.id, {
      selected: choiceIndex,
      unknown: false,
      reviewed: false,
    });
  };

  const goToQuestion = (index: number) => {
    setQuestionIndex(Math.min(questions.length - 1, Math.max(0, index)));
    setNoteOpen(false);
  };

  const handleSubmit = () => {
    setSubmitted(true);
    setSubmitOpen(false);

    setMissedQuestionIds((previousIds) => {
      const nextIds = new Set(previousIds);

      for (const question of questions) {
        const selected = answers[question.id]?.selected;
        if (selected === question.answer) {
          nextIds.delete(question.id);
        } else {
          nextIds.add(question.id);
        }
      }

      const orderedIds = ALL_QUESTIONS.filter((question) =>
        nextIds.has(question.id),
      ).map((question) => question.id);
      saveMissedQuestionIds(orderedIds);
      return orderedIds;
    });
  };

  const persistMissedQuestion = (questionId: string, isCorrect: boolean) => {
    setMissedQuestionIds((previousIds) => {
      const nextIds = new Set(previousIds);

      if (isCorrect) {
        nextIds.delete(questionId);
      } else {
        nextIds.add(questionId);
      }

      const orderedIds = ALL_QUESTIONS.filter((question) =>
        nextIds.has(question.id),
      ).map((question) => question.id);
      saveMissedQuestionIds(orderedIds);
      return orderedIds;
    });
  };

  const checkReviewAnswer = () => {
    if (!currentQuestion) return;

    const answer = answers[currentQuestion.id] ?? currentAnswer;
    const isCorrect = answer.selected === currentQuestion.answer;

    updateAnswer(currentQuestion.id, {
      reviewed: true,
      unknown: answer.unknown || answer.selected === null,
    });
    persistMissedQuestion(currentQuestion.id, isCorrect);
  };

  const markReviewUnknown = () => {
    if (!currentQuestion || currentAnswer.reviewed) return;

    updateAnswer(currentQuestion.id, {
      selected: null,
      unknown: !currentAnswer.unknown,
      reviewed: false,
    });
  };

  const resetReviewQuestion = () => {
    if (!currentQuestion) return;

    updateAnswer(currentQuestion.id, {
      selected: null,
      unknown: false,
      reviewed: false,
    });
  };

  const reviewedCount = useMemo(
    () => questions.filter((question) => answers[question.id]?.reviewed).length,
    [answers, questions],
  );

  if (stage === "hub") {
    return (
      <CbtHubPage
        missedCount={missedQuestionIds.length}
        onStartFull={beginFullRun}
        onSelectSession={() => setStage("session-select")}
        onStartReview={beginReviewRun}
      />
    );
  }

  if (stage === "session-select") {
    return (
      <SessionSelectPage
        onBack={() => setStage("hub")}
        onSelectSession={beginSessionRun}
      />
    );
  }

  if (stage === "review-empty" || !currentQuestion) {
    return (
      <ReviewEmptyPage
        onBack={() => setStage("hub")}
        onStartSession={() => setStage("session-select")}
      />
    );
  }

  if (mode === "review") {
    return (
      <ReviewPlayerPage
        title={runTitle}
        subtitle={runSubtitle}
        questions={questions}
        question={currentQuestion}
        answer={currentAnswer}
        answerMap={answers}
        questionIndex={questionIndex}
        reviewedCount={reviewedCount}
        onBack={returnToHub}
        onGoToQuestion={goToQuestion}
        onSelectChoice={answerQuestion}
        onCheckAnswer={checkReviewAnswer}
        onMarkUnknown={markReviewUnknown}
        onResetQuestion={resetReviewQuestion}
      />
    );
  }

  return (
    <main className="min-h-screen bg-[#f8f8f8] text-foreground">
      <header className="sticky top-0 z-30 border-b border-border bg-white">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-3 px-4 py-3 lg:flex-row lg:items-center">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <button
              type="button"
              onClick={returnToHub}
              aria-label="CBT 선택 화면으로 이동"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-white text-foreground active:scale-[0.98]"
            >
              <ArrowLeft aria-hidden="true" className="h-5 w-5" />
            </button>
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-brand text-lg font-extrabold text-white">
              {String(questionIndex + 1).padStart(2, "0")}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-brand">PillChat CBT</p>
              <h1 className="truncate text-base font-extrabold text-foreground md:text-lg">
                {runTitle}
              </h1>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {runSubtitle}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
            {mode === "session" ? (
              <SegmentedControl label="교시">
                {SESSIONS.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    aria-pressed={sessionId === item.id}
                    onClick={() => beginSessionRun(item.id)}
                    className={cn(
                      "h-9 rounded-md px-3 text-xs font-bold transition-colors",
                      sessionId === item.id
                        ? "bg-foreground text-background"
                        : "text-muted-foreground hover:bg-muted",
                    )}
                  >
                    {item.name}
                  </button>
                ))}
              </SegmentedControl>
            ) : (
              <div className="flex h-[2.875rem] items-center rounded-lg border border-border bg-white px-3 text-xs font-bold text-foreground">
                {mode === "full" ? "전체 실전" : "오답 복습"}
              </div>
            )}

            <SegmentedControl label="글자">
              {FONT_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={fontScale === option.value}
                  onClick={() => setFontScale(option.value)}
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-md font-extrabold transition-colors",
                    option.className,
                    fontScale === option.value
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:bg-muted",
                  )}
                >
                  {option.label}
                </button>
              ))}
            </SegmentedControl>

            <div className="col-span-2 flex items-center justify-between gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-amber-900 sm:col-span-1">
              <Clock aria-hidden="true" className="h-4 w-4" />
              <div className="min-w-0">
                <p className="text-[0.6875rem] font-semibold">남은 시간</p>
                <p
                  className={cn(
                    "text-sm font-extrabold tabular-nums",
                    lowTime && "text-destructive",
                  )}
                >
                  {formatMMSS(remainingSec)}
                </p>
              </div>
              <div className="border-l border-amber-200 pl-2 text-right">
                <p className="text-[0.6875rem] font-semibold">경과</p>
                <p className="text-xs font-bold tabular-nums">
                  {formatMMSS(elapsedSec)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-[1440px] gap-4 px-4 pb-[7.5rem] pt-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <section className="min-w-0 rounded-lg border border-border bg-white">
          <div className="flex flex-col gap-3 border-b border-border px-5 py-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-bold text-brand">
                {currentQuestion.subject} · {currentQuestion.topic}
              </p>
              <h2 className="mt-1 text-lg font-extrabold">문항풀이 연습</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              <IconAction
                icon={<Highlighter className="h-4 w-4" />}
                label="형광펜"
                active={highlightOn}
                onClick={() => setHighlightOn((value) => !value)}
              />
              <IconAction
                icon={<Eraser className="h-4 w-4" />}
                label="지우기"
                onClick={() => setHighlightOn(false)}
              />
              <IconAction
                icon={<StickyNote className="h-4 w-4" />}
                label="메모"
                active={noteOpen}
                onClick={() => setNoteOpen((value) => !value)}
              />
              <IconAction
                icon={<Flag className="h-4 w-4" />}
                label="체크"
                active={currentAnswer.flagged}
                onClick={() =>
                  updateAnswer(currentQuestion.id, {
                    flagged: !currentAnswer.flagged,
                  })
                }
              />
            </div>
          </div>

          <div
            className={cn(
              "grid gap-6 px-5 py-6",
              layoutMode === "split" && "xl:grid-cols-[minmax(0,1fr)_24rem]",
            )}
          >
            <div className="min-w-0">
              <div className="flex items-start gap-3">
                <span className="mt-1 shrink-0 text-lg font-extrabold tabular-nums">
                  {questionIndex + 1}.
                </span>
                <p
                  className={cn(
                    "min-w-0 flex-1 font-semibold text-foreground",
                    getStemClass(fontScale),
                    highlightOn && "rounded-md bg-amber-100 px-2 py-1",
                  )}
                >
                  {currentQuestion.stem}
                </p>
              </div>

              <div className="mt-4 flex flex-wrap gap-2 pl-8">
                <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-foreground">
                  {currentQuestion.id}
                </span>
                <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-foreground">
                  모의 문항
                </span>
                <span className="rounded-full bg-brandSecondary px-3 py-1 text-xs font-semibold text-brand">
                  {currentQuestion.subject}
                </span>
              </div>

              {noteOpen && (
                <textarea
                  rows={4}
                  placeholder="풀이 과정과 암기 포인트를 적어두세요."
                  className="mt-5 w-full resize-none rounded-lg border border-dashed border-border bg-[#fafafa] p-3 text-sm outline-none focus:border-brand"
                />
              )}
            </div>

            <div className="min-w-0">
              <ul className="grid gap-2">
                {currentQuestion.choices.map((choice, choiceIndex) => {
                  const selected = currentAnswer.selected === choiceIndex;
                  const isCorrect = choiceIndex === currentQuestion.answer;
                  const revealWrong = submitted && selected && !isCorrect;

                  return (
                    <li key={`${currentQuestion.id}-${choiceIndex}`}>
                      <button
                        type="button"
                        onClick={() => answerQuestion(choiceIndex)}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left transition-colors",
                          selected
                            ? "border-brand bg-brandSecondary"
                            : "border-border bg-white hover:bg-muted",
                          submitted &&
                            isCorrect &&
                            "border-emerald-500 bg-emerald-50",
                          revealWrong && "border-destructive bg-red-50",
                        )}
                      >
                        <span
                          className={cn(
                            "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-sm font-extrabold",
                            selected
                              ? "border-brand bg-brand text-white"
                              : "border-border bg-white text-muted-foreground",
                            submitted &&
                              isCorrect &&
                              "border-emerald-500 bg-emerald-600 text-white",
                            revealWrong &&
                              "border-destructive bg-destructive text-white",
                          )}
                        >
                          {CHOICE_LABELS[choiceIndex]}
                        </span>
                        <span
                          className={cn(
                            "flex-1 font-medium text-foreground",
                            getChoiceClass(fontScale),
                          )}
                        >
                          {choice}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>

              <button
                type="button"
                disabled={submitted}
                onClick={() =>
                  updateAnswer(currentQuestion.id, {
                    unknown: !currentAnswer.unknown,
                    selected: currentAnswer.unknown
                      ? currentAnswer.selected
                      : null,
                  })
                }
                className={cn(
                  "mt-4 inline-flex h-10 items-center gap-2 rounded-lg border px-3 text-sm font-bold transition-colors disabled:opacity-50",
                  currentAnswer.unknown
                    ? "border-sky-300 bg-sky-50 text-sky-700"
                    : "border-border bg-white text-muted-foreground hover:bg-muted",
                )}
              >
                <HelpCircle aria-hidden="true" className="h-4 w-4" />
                모르겠어요
              </button>

              {submitted && (
                <div className="mt-5 rounded-lg border border-border bg-[#fafafa] p-4">
                  <p className="text-sm font-extrabold text-foreground">해설</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {currentQuestion.explanation}
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

        <aside className="min-w-0 rounded-lg border border-border bg-white">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div>
              <p className="text-xs font-bold text-brand">답안 표기란</p>
              <h2 className="mt-0.5 text-base font-extrabold">
                {summary.answered}/{questions.length}
              </h2>
            </div>
            <button
              type="button"
              onClick={() =>
                setLayoutMode((value) =>
                  value === "single" ? "split" : "single",
                )
              }
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-white text-muted-foreground hover:bg-muted"
              aria-label="문항 배치 전환"
            >
              {layoutMode === "single" ? (
                <LayoutPanelLeft aria-hidden="true" className="h-4 w-4" />
              ) : (
                <Maximize2 aria-hidden="true" className="h-4 w-4" />
              )}
            </button>
          </div>

          <div className="grid max-h-[34rem] grid-cols-2 gap-2 overflow-y-auto p-3 sm:grid-cols-4 lg:grid-cols-1">
            {questions.map((question, index) => {
              const answer = answers[question.id];
              const current = questionIndex === index;
              const answered =
                answer?.selected !== null && answer?.selected !== undefined;

              return (
                <button
                  key={question.id}
                  type="button"
                  onClick={() => goToQuestion(index)}
                  className={cn(
                    "grid grid-cols-[2.25rem_minmax(0,1fr)_1.5rem] items-center gap-2 rounded-lg border px-2 py-2 text-left transition-colors",
                    current
                      ? "border-brand bg-brandSecondary"
                      : "border-transparent hover:border-border hover:bg-muted",
                  )}
                >
                  <span className="text-xs font-extrabold tabular-nums text-foreground">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="flex min-w-0 gap-1">
                    {CHOICE_LABELS.map((label, choiceIndex) => (
                      <span
                        key={`${question.id}-${label}`}
                        className={cn(
                          "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[0.6875rem] font-extrabold",
                          answer?.selected === choiceIndex
                            ? "border-brand bg-brand text-white"
                            : "border-border bg-white text-muted-foreground",
                        )}
                      >
                        {label}
                      </span>
                    ))}
                  </span>
                  <span className="flex justify-end gap-1">
                    {answer?.flagged && (
                      <span className="h-2 w-2 rounded-full bg-brand" />
                    )}
                    {answer?.unknown && (
                      <span className="h-2 w-2 rounded-full bg-sky-500" />
                    )}
                    {answered && !answer?.flagged && !answer?.unknown && (
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </aside>
      </div>

      <footer className="fixed bottom-0 left-1/2 z-30 w-full max-w-[1440px] -translate-x-1/2 border-t border-border bg-white px-4 py-3">
        <div className="flex flex-wrap items-center gap-2 pr-4 sm:pr-16">
          <ToolbarButton
            icon={<Calculator className="h-4 w-4" />}
            label="계산기"
            onClick={() => setCalculatorOpen(true)}
          />
          <ToolbarButton
            icon={<RotateCcw className="h-4 w-4" />}
            label="초기화"
            onClick={resetCurrentRun}
          />

          <div className="flex min-w-0 flex-1 items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => goToQuestion(questionIndex - 1)}
              disabled={questionIndex === 0}
              className="flex h-10 items-center gap-1 rounded-lg border border-border px-3 text-sm font-bold disabled:opacity-40"
            >
              <ChevronLeft aria-hidden="true" className="h-4 w-4" />
              이전
            </button>
            <span className="rounded-full bg-muted px-3 py-2 text-xs font-extrabold tabular-nums">
              {questionIndex + 1} / {questions.length}
            </span>
            <button
              type="button"
              onClick={() => goToQuestion(questionIndex + 1)}
              disabled={questionIndex === questions.length - 1}
              className="flex h-10 items-center gap-1 rounded-lg bg-brand px-3 text-sm font-bold text-white disabled:opacity-40"
            >
              다음
              <ChevronRight aria-hidden="true" className="h-4 w-4" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <StatusPill
              icon={<ListChecks className="h-3.5 w-3.5" />}
              label="안 푼 문제"
              value={summary.unanswered}
              active={summary.unanswered > 0}
            />
            <StatusPill
              icon={<CheckSquare className="h-3.5 w-3.5" />}
              label="체크"
              value={summary.flagged}
            />
            <button
              type="button"
              onClick={() => setSubmitOpen(true)}
              className="h-10 rounded-lg bg-foreground px-4 text-sm font-extrabold text-background active:scale-[0.98]"
            >
              제출
            </button>
          </div>
        </div>
      </footer>

      {calculatorOpen && (
        <CalculatorPanel onClose={() => setCalculatorOpen(false)} />
      )}

      {submitOpen && (
        <SubmitDialog
          submitted={submitted}
          summary={summary}
          total={questions.length}
          onClose={() => setSubmitOpen(false)}
          onSubmit={handleSubmit}
        />
      )}
    </main>
  );
}

function ReviewPlayerPage({
  title,
  subtitle,
  questions,
  question,
  answer,
  answerMap,
  questionIndex,
  reviewedCount,
  onBack,
  onGoToQuestion,
  onSelectChoice,
  onCheckAnswer,
  onMarkUnknown,
  onResetQuestion,
}: {
  title: string;
  subtitle: string;
  questions: CbtQuestion[];
  question: CbtQuestion;
  answer: AnswerState;
  answerMap: Record<string, AnswerState>;
  questionIndex: number;
  reviewedCount: number;
  onBack: () => void;
  onGoToQuestion: (index: number) => void;
  onSelectChoice: (choiceIndex: number) => void;
  onCheckAnswer: () => void;
  onMarkUnknown: () => void;
  onResetQuestion: () => void;
}) {
  const isRevealed = answer.reviewed;
  const isCorrect = answer.selected === question.answer;
  const hasAnswer = answer.selected !== null || answer.unknown;
  const isLastQuestion = questionIndex === questions.length - 1;
  const progressPercent = Math.round(
    ((questionIndex + 1) / questions.length) * 100,
  );

  const handlePrimaryAction = () => {
    if (!isRevealed) {
      onCheckAnswer();
      return;
    }

    if (isLastQuestion) {
      onBack();
      return;
    }

    onGoToQuestion(questionIndex + 1);
  };

  return (
    <main className="min-h-screen bg-[#f8f8f8] pb-28 text-foreground">
      <header className="sticky top-0 z-30 border-b border-border bg-white">
        <div className="mx-auto flex max-w-[52rem] items-center gap-3 px-5 py-4">
          <button
            type="button"
            onClick={onBack}
            aria-label="CBT 선택 화면으로 이동"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-white active:scale-[0.98]"
          >
            <ArrowLeft aria-hidden="true" className="h-5 w-5" />
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-brand">PillChat CBT</p>
            <h1 className="mt-1 truncate text-xl font-extrabold">{title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
          </div>
          <div className="hidden rounded-lg border border-border bg-white px-3 py-2 text-right sm:block">
            <p className="text-[0.6875rem] font-bold text-muted-foreground">
              확인
            </p>
            <p className="text-sm font-extrabold tabular-nums">
              {reviewedCount}/{questions.length}
            </p>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-[52rem] px-5 py-5">
        <div className="mb-4 h-2 overflow-hidden rounded-full bg-white shadow-[inset_0_0_0_1px_rgba(17,17,17,0.06)]">
          <div
            className="h-full rounded-full bg-brand transition-[width]"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <article className="overflow-hidden rounded-lg border border-border bg-white">
          <div className="flex flex-col gap-3 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-bold text-brand">
                {question.subject} · {question.topic}
              </p>
              <h2 className="mt-1 text-lg font-extrabold">
                {questionIndex + 1}번 문제
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-muted px-3 py-1 text-xs font-bold text-foreground">
                {questionIndex + 1} / {questions.length}
              </span>
              {isRevealed && (
                <span
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-extrabold",
                    isCorrect
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-red-50 text-destructive",
                  )}
                >
                  {isCorrect ? "정답" : "오답"}
                </span>
              )}
            </div>
          </div>

          <div className="px-5 py-6">
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand text-sm font-extrabold text-white">
                Q
              </span>
              <p className="min-w-0 flex-1 text-lg font-semibold leading-8 text-foreground">
                {question.stem}
              </p>
            </div>

            <ul className="mt-6 grid gap-3">
              {question.choices.map((choice, choiceIndex) => {
                const selected = answer.selected === choiceIndex;
                const correctChoice = choiceIndex === question.answer;
                const revealWrong = isRevealed && selected && !correctChoice;
                const mutedChoice = isRevealed && !selected && !correctChoice;

                return (
                  <li key={`${question.id}-${choiceIndex}`}>
                    <button
                      type="button"
                      onClick={() => {
                        if (!isRevealed) onSelectChoice(choiceIndex);
                      }}
                      disabled={isRevealed}
                      className={cn(
                        "flex min-h-14 w-full items-start gap-3 rounded-lg border px-4 py-3 text-left transition-colors",
                        selected
                          ? "border-brand bg-brandSecondary"
                          : "border-border bg-white hover:bg-muted",
                        isRevealed &&
                          correctChoice &&
                          "border-emerald-500 bg-emerald-50",
                        revealWrong && "border-destructive bg-red-50",
                        mutedChoice && "opacity-55",
                      )}
                    >
                      <span
                        className={cn(
                          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-sm font-extrabold",
                          selected
                            ? "border-brand bg-brand text-white"
                            : "border-border bg-white text-muted-foreground",
                          isRevealed &&
                            correctChoice &&
                            "border-emerald-500 bg-emerald-600 text-white",
                          revealWrong &&
                            "border-destructive bg-destructive text-white",
                        )}
                      >
                        {CHOICE_LABELS[choiceIndex]}
                      </span>
                      <span className="min-w-0 flex-1 text-base font-medium leading-7">
                        {choice}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>

            <div className="mt-5 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={onMarkUnknown}
                disabled={isRevealed}
                className={cn(
                  "inline-flex h-10 items-center gap-2 rounded-lg border px-3 text-sm font-bold transition-colors disabled:opacity-50",
                  answer.unknown
                    ? "border-sky-300 bg-sky-50 text-sky-700"
                    : "border-border bg-white text-muted-foreground hover:bg-muted",
                )}
              >
                <HelpCircle aria-hidden="true" className="h-4 w-4" />
                모르겠어요
              </button>

              {isRevealed && (
                <button
                  type="button"
                  onClick={onResetQuestion}
                  className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-white px-3 text-sm font-bold text-foreground hover:bg-muted"
                >
                  <RotateCcw aria-hidden="true" className="h-4 w-4" />
                  다시 풀기
                </button>
              )}
            </div>

            {isRevealed && (
              <div className="mt-6 border-t border-border pt-5">
                <div
                  className={cn(
                    "flex items-center gap-2 text-base font-extrabold",
                    isCorrect ? "text-emerald-700" : "text-destructive",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full text-sm text-white",
                      isCorrect ? "bg-emerald-600" : "bg-destructive",
                    )}
                  >
                    {isCorrect ? "O" : "X"}
                  </span>
                  <span>
                    {isCorrect
                      ? "정답입니다"
                      : `정답은 ${CHOICE_LABELS[question.answer]}번입니다`}
                  </span>
                </div>

                <div className="mt-4 border-l-4 border-brand bg-[#fafafa] px-4 py-3">
                  <p className="text-sm font-bold text-foreground">
                    정답: {question.choices[question.answer]}
                  </p>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    {question.explanation}
                  </p>
                </div>
              </div>
            )}
          </div>
        </article>

        <nav
          aria-label="오답 문항 이동"
          className="mt-4 flex gap-2 overflow-x-auto pb-1"
        >
          {questions.map((item, index) => {
            const reviewed = answerMap[item.id]?.reviewed ?? false;
            const current = index === questionIndex;

            return (
              <button
                key={item.id}
                type="button"
                aria-current={current ? "step" : undefined}
                onClick={() => onGoToQuestion(index)}
                className={cn(
                  "flex h-9 min-w-9 items-center justify-center rounded-lg border px-3 text-xs font-extrabold tabular-nums",
                  current
                    ? "border-brand bg-brand text-white"
                    : reviewed
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-border bg-white text-muted-foreground",
                )}
              >
                {index + 1}
              </button>
            );
          })}
        </nav>
      </section>

      <footer className="fixed bottom-0 left-1/2 z-30 w-full max-w-[52rem] -translate-x-1/2 border-t border-border bg-white px-5 py-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onGoToQuestion(questionIndex - 1)}
            disabled={questionIndex === 0}
            className="flex h-11 items-center gap-1 rounded-lg border border-border bg-white px-3 text-sm font-extrabold disabled:opacity-40"
          >
            <ChevronLeft aria-hidden="true" className="h-4 w-4" />
            이전
          </button>
          <div className="min-w-0 flex-1 text-center">
            <p className="text-xs font-bold text-muted-foreground sm:hidden">
              {reviewedCount}/{questions.length} 확인
            </p>
            <p className="text-sm font-extrabold tabular-nums">
              {questionIndex + 1} / {questions.length}
            </p>
          </div>
          <button
            type="button"
            onClick={handlePrimaryAction}
            disabled={!isRevealed && !hasAnswer}
            className="flex h-11 min-w-[7.5rem] items-center justify-center gap-1 rounded-lg bg-brand px-4 text-sm font-extrabold text-white disabled:bg-gray-200 disabled:text-muted-foreground"
          >
            {isRevealed ? (
              <>
                {isLastQuestion ? "마치기" : "다음"}
                <ChevronRight aria-hidden="true" className="h-4 w-4" />
              </>
            ) : (
              <>
                <CheckSquare aria-hidden="true" className="h-4 w-4" />
                정답 확인
              </>
            )}
          </button>
        </div>
      </footer>
    </main>
  );
}

function CbtHubPage({
  missedCount,
  onStartFull,
  onSelectSession,
  onStartReview,
}: {
  missedCount: number;
  onStartFull: () => void;
  onSelectSession: () => void;
  onStartReview: () => void;
}) {
  return (
    <main className="min-h-screen bg-[#f8f8f8] text-foreground">
      <header className="border-b border-border bg-white px-5 py-4">
        <div className="mx-auto flex max-w-[960px] items-center gap-3">
          <Link
            href="/questionbank"
            aria-label="학습 페이지로 이동"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-white active:scale-[0.98]"
          >
            <ArrowLeft aria-hidden="true" className="h-5 w-5" />
          </Link>
          <div>
            <p className="text-xs font-bold text-brand">PillChat CBT</p>
            <h1 className="mt-1 text-xl font-extrabold">국시 유형 CBT 연습</h1>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-[960px] px-5 py-8">
        <div className="rounded-lg border border-border bg-white p-5">
          <p className="text-sm font-bold text-brand">학습 모드 선택</p>
          <h2 className="mt-2 text-[1.75rem] font-extrabold leading-10">
            원하는 방식으로 문제풀이를 시작하세요.
          </h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            전체 실전은 4교시 전체 흐름으로, 교시별 연습은 선택한 교시만, 오답
            복습은 이전 제출에서 맞추지 못한 문제만 모아 풉니다.
          </p>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <ModeCard
            icon={<FileText aria-hidden="true" className="h-6 w-6" />}
            title="전체 실전 모의고사"
            description={`4교시 전체 ${ALL_QUESTIONS.length}문항을 실제 시간 흐름에 맞춰 풀어요.`}
            meta={`${TOTAL_MINUTES}분 · 전체 문항`}
            onClick={onStartFull}
          />
          <ModeCard
            icon={<LayoutPanelLeft aria-hidden="true" className="h-6 w-6" />}
            title="교시별 연습"
            description="1교시부터 4교시까지 원하는 교시를 골라 한 세트씩 풀어요."
            meta="교시 선택"
            onClick={onSelectSession}
          />
          <ModeCard
            icon={<RotateCcw aria-hidden="true" className="h-6 w-6" />}
            title="오답 복습"
            description="지금까지 제출한 결과에서 틀렸거나 안 푼 문제를 다시 풀어요."
            meta={`${missedCount}문항 저장됨`}
            onClick={onStartReview}
          />
        </div>
      </section>
    </main>
  );
}

function ModeCard({
  icon,
  title,
  description,
  meta,
  onClick,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  meta: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-[15rem] flex-col rounded-lg border border-border bg-white p-5 text-left transition-colors hover:border-brand hover:bg-brandSecondary active:scale-[0.99]"
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-brandSecondary text-brand">
        {icon}
      </span>
      <strong className="mt-5 text-lg font-extrabold text-foreground">
        {title}
      </strong>
      <span className="mt-3 min-h-[4.5rem] text-sm leading-6 text-muted-foreground">
        {description}
      </span>
      <span className="mt-auto inline-flex h-9 items-center rounded-full bg-muted px-3 text-xs font-bold text-foreground">
        {meta}
      </span>
    </button>
  );
}

function SessionSelectPage({
  onBack,
  onSelectSession,
}: {
  onBack: () => void;
  onSelectSession: (sessionId: SessionId) => void;
}) {
  return (
    <main className="min-h-screen bg-[#f8f8f8] text-foreground">
      <header className="border-b border-border bg-white px-5 py-4">
        <div className="mx-auto flex max-w-[960px] items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            aria-label="CBT 선택 화면으로 이동"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-white active:scale-[0.98]"
          >
            <ArrowLeft aria-hidden="true" className="h-5 w-5" />
          </button>
          <div>
            <p className="text-xs font-bold text-brand">교시별 연습</p>
            <h1 className="mt-1 text-xl font-extrabold">교시 선택</h1>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-[960px] px-5 py-8">
        <div className="grid gap-3 md:grid-cols-2">
          {SESSIONS.map((session) => (
            <button
              key={session.id}
              type="button"
              onClick={() => onSelectSession(session.id)}
              className="rounded-lg border border-border bg-white p-5 text-left transition-colors hover:border-brand hover:bg-brandSecondary active:scale-[0.99]"
            >
              <span className="text-xs font-bold text-brand">
                {session.name}
              </span>
              <strong className="mt-2 block text-lg font-extrabold">
                {session.subjectsLabel}
              </strong>
              <span className="mt-2 block text-sm leading-6 text-muted-foreground">
                {session.startTime}-{session.endTime} · {session.total}문항 ·{" "}
                {session.durationMin}분
              </span>
              <div className="mt-4 flex flex-wrap gap-2">
                {session.subjects.map((subject) => (
                  <span
                    key={subject.subject}
                    className="rounded-full bg-muted px-3 py-1 text-xs font-bold text-foreground"
                  >
                    {subject.subject} {subject.count}문항
                  </span>
                ))}
              </div>
            </button>
          ))}
        </div>
      </section>
    </main>
  );
}

function ReviewEmptyPage({
  onBack,
  onStartSession,
}: {
  onBack: () => void;
  onStartSession: () => void;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f8f8f8] px-5 text-foreground">
      <section className="w-full max-w-[28rem] rounded-lg border border-border bg-white p-6 text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-lg bg-brandSecondary text-brand">
          <RotateCcw aria-hidden="true" className="h-7 w-7" />
        </span>
        <h1 className="mt-5 text-xl font-extrabold">오답이 아직 없어요</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          전체 실전이나 교시별 연습을 제출하면 틀렸거나 안 푼 문제가 여기에
          자동으로 모입니다.
        </p>
        <div className="mt-6 grid gap-2">
          <button
            type="button"
            onClick={onStartSession}
            className="h-12 rounded-lg bg-brand text-sm font-extrabold text-white active:scale-[0.98]"
          >
            교시별 연습 시작
          </button>
          <button
            type="button"
            onClick={onBack}
            className="h-12 rounded-lg border border-border bg-white text-sm font-extrabold hover:bg-muted"
          >
            선택 화면으로
          </button>
        </div>
      </section>
    </main>
  );
}

function SegmentedControl({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-border bg-white px-2 py-1">
      <span className="text-[0.6875rem] font-bold text-muted-foreground">
        {label}
      </span>
      <div className="flex items-center gap-1">{children}</div>
    </div>
  );
}

function IconAction({
  icon,
  label,
  active,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex h-10 items-center gap-2 rounded-lg border px-3 text-sm font-bold transition-colors",
        active
          ? "border-brand bg-brandSecondary text-brand"
          : "border-border bg-white text-muted-foreground hover:bg-muted",
      )}
    >
      {icon}
      {label}
    </button>
  );
}

function ToolbarButton({
  icon,
  label,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-10 items-center gap-2 rounded-lg border border-border bg-white px-3 text-sm font-bold text-foreground hover:bg-muted"
    >
      {icon}
      {label}
    </button>
  );
}

function StatusPill({
  icon,
  label,
  value,
  active,
}: {
  icon: ReactNode;
  label: string;
  value: number;
  active?: boolean;
}) {
  return (
    <div
      className={cn(
        "hidden h-10 items-center gap-1.5 rounded-lg border px-3 text-xs font-bold sm:flex",
        active
          ? "border-destructive/30 bg-red-50 text-destructive"
          : "border-border bg-white text-muted-foreground",
      )}
    >
      {icon}
      {label}
      <span className="tabular-nums">{value}</span>
    </div>
  );
}

function CalculatorPanel({ onClose }: { onClose: () => void }) {
  const [expression, setExpression] = useState("0");

  const press = (key: string) => {
    setExpression((current) => {
      if (key === "C") return "0";
      if (key === "=") {
        try {
          const safe = current.replace(/×/g, "*").replace(/÷/g, "/");
          if (!/^[\d+\-*/.() ]+$/.test(safe)) return "Err";
          // eslint-disable-next-line no-new-func
          const result = Function(`"use strict"; return (${safe})`)();
          return String(result);
        } catch {
          return "Err";
        }
      }
      if (current === "0" || current === "Err") {
        return /[\d.]/.test(key) ? key : `0${key}`;
      }
      return `${current}${key}`;
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/30 p-4" onClick={onClose}>
      <div
        className="ml-auto mt-20 w-full max-w-[20rem] rounded-lg border border-border bg-white p-3 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border pb-2">
          <span className="text-sm font-extrabold">계산기</span>
          <button
            type="button"
            aria-label="계산기 닫기"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-muted"
          >
            <X aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-3 rounded-lg bg-[#f7f7f7] px-3 py-4 text-right text-xl font-extrabold tabular-nums">
          {expression}
        </div>
        <div className="mt-3 grid grid-cols-4 gap-2">
          {[
            "C",
            "(",
            ")",
            "÷",
            "7",
            "8",
            "9",
            "×",
            "4",
            "5",
            "6",
            "-",
            "1",
            "2",
            "3",
            "+",
            "0",
            ".",
            "=",
          ].map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => press(key)}
              className={cn(
                "h-11 rounded-lg text-sm font-extrabold",
                key === "="
                  ? "bg-brand text-white"
                  : key === "C"
                    ? "bg-red-50 text-destructive"
                    : /[÷×\-+]/.test(key)
                      ? "bg-brandSecondary text-brand"
                      : "bg-muted text-foreground",
              )}
            >
              {key}
            </button>
          ))}
          <div />
        </div>
      </div>
    </div>
  );
}

function SubmitDialog({
  submitted,
  summary,
  total,
  onClose,
  onSubmit,
}: {
  submitted: boolean;
  summary: {
    answered: number;
    unanswered: number;
    flagged: number;
    unknown: number;
    correct: number;
    accuracy: number;
  };
  total: number;
  onClose: () => void;
  onSubmit: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[24rem] rounded-lg border border-border bg-white p-5 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold text-brand">
              {submitted ? "결과" : "제출 확인"}
            </p>
            <h3 className="mt-1 text-lg font-extrabold">
              {submitted ? "채점 결과" : "답안을 제출할까요?"}
            </h3>
          </div>
          <button
            type="button"
            aria-label="닫기"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-muted"
          >
            <X aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <ResultBox label="총 문항" value={total} />
          <ResultBox label="푼 문항" value={summary.answered} />
          <ResultBox
            label="안 푼 문항"
            value={summary.unanswered}
            accent={summary.unanswered > 0}
          />
          <ResultBox label="체크" value={summary.flagged} />
          {submitted && (
            <>
              <ResultBox label="정답" value={summary.correct} />
              <ResultBox label="정답률" value={`${summary.accuracy}%`} />
            </>
          )}
        </div>

        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="h-12 flex-1 rounded-lg border border-border bg-white text-sm font-extrabold hover:bg-muted"
          >
            {submitted ? "닫기" : "계속 풀기"}
          </button>
          {!submitted && (
            <button
              type="button"
              onClick={onSubmit}
              className="h-12 flex-1 rounded-lg bg-brand text-sm font-extrabold text-white active:scale-[0.98]"
            >
              제출하기
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function ResultBox({
  label,
  value,
  accent,
}: {
  label: string;
  value: number | string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-lg bg-[#f7f7f7] px-3 py-3 text-center">
      <div
        className={cn(
          "text-xl font-extrabold tabular-nums",
          accent && "text-destructive",
        )}
      >
        {value}
      </div>
      <div className="mt-1 text-xs font-medium text-muted-foreground">
        {label}
      </div>
    </div>
  );
}
