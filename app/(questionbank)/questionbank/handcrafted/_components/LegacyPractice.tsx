"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  BadgeCheck,
  Bookmark,
  BookmarkCheck,
  Check,
  ChevronRight,
  CircleHelp,
  RotateCcw,
  Trophy,
  X,
} from "lucide-react";

import { AppShell, PracticeHeader } from "@/components/molecules";
import { completeDailyQuest } from "@/lib/client/dailyQuest";
import { useRouter } from "@/lib/navigation";
import {
  saveReviewCollection,
  readHandcraftedBookmarks,
  setHandcraftedBookmark,
  HANDCRAFTED_BOOKMARK_UPDATED_EVENT,
} from "@/lib/review/collections";
import {
  handcraftedQuestions as questions,
  type HandcraftedQuestion as Question,
} from "@/lib/handcrafted/questions";
import { buildHandcraftedReviewCollection } from "@/lib/handcrafted/review";
import HandcraftedTutorial from "./HandcraftedTutorial";

type Answer = {
  questionId: number;
  selected: number | null;
  isCorrect: boolean;
  unknown: boolean;
};

type SavedAttempt = {
  id: string;
  questionIds: number[];
  currentIndex: number;
  answers: Answer[];
};

const STORAGE_KEY = "pillchat:handcrafted-attempt";
export default function HandcraftedPage() {
  const router = useRouter();
  const handledSampleMode = useRef(false);
  const [stage, setStage] = useState<"setup" | "player" | "result">("setup");
  const [topic, setTopic] = useState("약리학");
  const [subtopic, setSubtopic] = useState("전체");
  const [count, setCount] = useState<3 | 5 | "all">(3);
  const [attempt, setAttempt] = useState<SavedAttempt | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [graded, setGraded] = useState(false);
  const [bookmarks, setBookmarks] = useState<number[]>([]);
  const [savedAttempt, setSavedAttempt] = useState<SavedAttempt | null>(null);
  const [showTutorial, setShowTutorial] = useState(false);
  const [reviewSaveFailed, setReviewSaveFailed] = useState(false);

  const subtopics = useMemo(
    () => [
      "전체",
      ...new Set(
        questions
          .filter((question) => question.topic === topic)
          .map((question) => question.subtopic),
      ),
    ],
    [topic],
  );

  const activeQuestions = useMemo(
    () =>
      attempt
        ? attempt.questionIds
            .map((id) => questions.find((question) => question.id === id))
            .filter((question): question is Question => Boolean(question))
        : [],
    [attempt],
  );
  const currentQuestion = activeQuestions[attempt?.currentIndex ?? 0];

  useEffect(() => {
    const refreshBookmarks = () =>
      setBookmarks(readHandcraftedBookmarks().map(Number));
    refreshBookmarks();
    window.addEventListener(
      HANDCRAFTED_BOOKMARK_UPDATED_EVENT,
      refreshBookmarks,
    );
    window.addEventListener("storage", refreshBookmarks);
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setSavedAttempt(JSON.parse(raw) as SavedAttempt);
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    }
    return () => {
      window.removeEventListener(
        HANDCRAFTED_BOOKMARK_UPDATED_EVENT,
        refreshBookmarks,
      );
      window.removeEventListener("storage", refreshBookmarks);
    };
  }, []);

  useEffect(() => {
    if (handledSampleMode.current) return;
    handledSampleMode.current = true;

    const isSample =
      new URLSearchParams(window.location.search).get("mode") === "sample";
    if (!isSample) return;

    const sampleAttempt: SavedAttempt = {
      id: `sample-${Date.now()}`,
      questionIds: questions.slice(0, 3).map((question) => question.id),
      currentIndex: 0,
      answers: [],
    };
    setAttempt(sampleAttempt);
    setStage("player");
  }, []);

  useEffect(() => {
    if (stage !== "player" || !attempt) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(attempt));
  }, [attempt, stage]);

  useEffect(() => {
    const record = attempt ?? savedAttempt;
    if (!record) return;
    const collection = buildHandcraftedReviewCollection(
      record,
      questions,
      bookmarks,
    );
    if (collection) setReviewSaveFailed(!saveReviewCollection(collection));
  }, [attempt, savedAttempt, bookmarks]);

  const startAttempt = () => {
    const pool = questions.filter(
      (question) =>
        question.topic === topic &&
        (subtopic === "전체" || question.subtopic === subtopic),
    );
    const selectedQuestions = count === "all" ? pool : pool.slice(0, count);
    const nextAttempt: SavedAttempt = {
      id: `handcrafted-${Date.now()}`,
      questionIds: selectedQuestions.map((question) => question.id),
      currentIndex: 0,
      answers: [],
    };
    setAttempt(nextAttempt);
    setSelected(null);
    setGraded(false);
    setStage("player");
  };

  const resumeAttempt = () => {
    if (!savedAttempt) return;
    const savedQuestionId = savedAttempt.questionIds[savedAttempt.currentIndex];
    const savedAnswer = savedAttempt.answers.find(
      (answer) => answer.questionId === savedQuestionId,
    );
    setAttempt(savedAttempt);
    setSelected(savedAnswer?.selected ?? null);
    setGraded(Boolean(savedAnswer));
    setStage("player");
  };

  const gradeAnswer = (unknown = false) => {
    if (!attempt || !currentQuestion || (selected === null && !unknown)) return;
    const answer: Answer = {
      questionId: currentQuestion.id,
      selected: unknown ? null : selected,
      isCorrect: !unknown && selected === currentQuestion.answer,
      unknown,
    };
    setAttempt({
      ...attempt,
      answers: [
        ...attempt.answers.filter(
          (item) => item.questionId !== currentQuestion.id,
        ),
        answer,
      ],
    });
    setGraded(true);
  };

  const goNext = () => {
    if (!attempt) return;
    if (attempt.currentIndex >= activeQuestions.length - 1) {
      window.localStorage.removeItem(STORAGE_KEY);
      setSavedAttempt(null);
      completeDailyQuest("sample");
      setStage("result");
      return;
    }
    setAttempt({ ...attempt, currentIndex: attempt.currentIndex + 1 });
    setSelected(null);
    setGraded(false);
  };

  const toggleBookmark = () => {
    if (!currentQuestion) return;
    const saved = setHandcraftedBookmark(
      String(currentQuestion.id),
      !bookmarks.includes(currentQuestion.id),
    );
    setReviewSaveFailed(!saved);
  };

  const reset = () => {
    setAttempt(null);
    setSelected(null);
    setGraded(false);
    setStage("setup");
  };

  const correctCount =
    attempt?.answers.filter((answer) => answer.isCorrect).length ?? 0;
  const unknownCount =
    attempt?.answers.filter((answer) => answer.unknown).length ?? 0;
  const accuracy = attempt?.answers.length
    ? Math.round((correctCount / attempt.answers.length) * 100)
    : 0;

  return (
    <AppShell className="min-h-dvh bg-white">
      {showTutorial && (
        <HandcraftedTutorial onClose={() => setShowTutorial(false)} />
      )}
      <PracticeHeader
        title="수제 제작 문제"
        subtitle="전문가 제작 · 검수 완료"
        onBack={() =>
          stage === "setup" ? router.push("/questionbank") : reset()
        }
        rightSlot={
          <BadgeCheck className="h-5 w-5 text-primary" aria-hidden="true" />
        }
      />

      {reviewSaveFailed && (
        <p
          role="alert"
          className="mx-5 mb-3 rounded-xl bg-red-50 p-3 text-sm text-red-700"
        >
          복습 기록을 저장하지 못했어요. 기기의 저장 공간과 브라우저 설정을
          확인해주세요.
        </p>
      )}

      {stage === "setup" && (
        <main className="px-5 py-7 md:px-10 md:py-9">
          <section>
            <p className="text-sm font-semibold text-primary">
              검수된 문제만 골라서
            </p>
            <h1 className="mt-1 text-2xl font-bold text-foreground md:text-[1.75rem]">
              오늘 풀 문제를 선택하세요
            </h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              원하는 범위와 문항 수를 선택하면 바로 풀이를 시작합니다.
            </p>
          </section>

          <button
            type="button"
            onClick={() => setShowTutorial(true)}
            className="mt-5 flex items-center gap-2 text-sm font-semibold text-primary"
          >
            <CircleHelp className="h-4 w-4" />
            풀이·북마크 사용법 익히기
          </button>

          {savedAttempt && (
            <button
              type="button"
              onClick={resumeAttempt}
              className="mt-6 flex w-full items-center gap-3 rounded-xl border border-primary/20 bg-brandSecondary px-4 py-4 text-left"
            >
              <RotateCcw
                className="h-5 w-5 shrink-0 text-primary"
                aria-hidden="true"
              />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold text-foreground">
                  풀던 문제 이어하기
                </span>
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  {savedAttempt.currentIndex + 1}/
                  {savedAttempt.questionIds.length}번 문항부터
                </span>
              </span>
              <ChevronRight
                className="h-5 w-5 text-primary"
                aria-hidden="true"
              />
            </button>
          )}

          <section className="mt-7 space-y-7 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm md:p-7">
            <fieldset>
              <legend className="text-sm font-bold text-foreground">
                과목
              </legend>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {["약리학", "약제학"].map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => {
                      setTopic(item);
                      setSubtopic("전체");
                    }}
                    className={`h-11 rounded-xl border text-sm font-semibold transition-colors ${
                      topic === item
                        ? "border-primary bg-brandSecondary text-primary"
                        : "border-gray-200 bg-white text-muted-foreground"
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </fieldset>

            <fieldset>
              <legend className="text-sm font-bold text-foreground">
                세부 주제
              </legend>
              <div className="mt-3 flex flex-wrap gap-2">
                {subtopics.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setSubtopic(item)}
                    className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                      subtopic === item
                        ? "border-primary bg-primary text-white"
                        : "border-gray-200 bg-white text-muted-foreground"
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </fieldset>

            <fieldset>
              <legend className="text-sm font-bold text-foreground">
                문항 수
              </legend>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {(
                  [
                    [3, "3문제"],
                    [5, "5문제"],
                    ["all", "전체"],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setCount(value)}
                    className={`h-11 rounded-xl border text-sm font-semibold transition-colors ${
                      count === value
                        ? "border-primary bg-brandSecondary text-primary"
                        : "border-gray-200 bg-white text-muted-foreground"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </fieldset>
          </section>

          <button
            type="button"
            onClick={startAttempt}
            className="mt-5 h-14 w-full rounded-xl bg-primary text-base font-bold text-white shadow-sm transition-opacity active:opacity-80"
          >
            문제 풀기
          </button>
        </main>
      )}

      {stage === "player" && attempt && currentQuestion && (
        <main className="px-5 py-6 md:px-10 md:py-8">
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm font-semibold text-foreground">
              {attempt.currentIndex + 1} / {activeQuestions.length}
            </p>
            <p className="text-xs font-medium text-muted-foreground">
              {currentQuestion.topic} · {currentQuestion.subtopic}
            </p>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-full rounded-full bg-primary transition-[width]"
              style={{
                width: `${((attempt.currentIndex + 1) / activeQuestions.length) * 100}%`,
              }}
            />
          </div>

          <section className="mt-5 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm md:p-8">
            <div className="flex items-start justify-between gap-4">
              <span className="flex h-8 min-w-8 items-center justify-center rounded-lg bg-brandSecondary px-2 text-sm font-bold text-primary">
                Q{attempt.currentIndex + 1}
              </span>
              <button
                type="button"
                onClick={toggleBookmark}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-muted-foreground"
                aria-label={
                  bookmarks.includes(currentQuestion.id)
                    ? "북마크 해제"
                    : "북마크"
                }
              >
                {bookmarks.includes(currentQuestion.id) ? (
                  <BookmarkCheck
                    className="h-5 w-5 text-primary"
                    aria-hidden="true"
                  />
                ) : (
                  <Bookmark className="h-5 w-5" aria-hidden="true" />
                )}
              </button>
            </div>
            <h1 className="mt-5 text-lg font-bold leading-8 text-foreground md:text-xl">
              {currentQuestion.prompt}
            </h1>

            <div className="mt-6 space-y-3">
              {currentQuestion.choices.map((choice, index) => {
                const isAnswer = index === currentQuestion.answer;
                const isSelected = index === selected;
                const resultClass = graded
                  ? isAnswer
                    ? "border-green-500 bg-green-50 text-green-900"
                    : isSelected
                      ? "border-red-400 bg-red-50 text-red-900"
                      : "border-gray-200 bg-white text-muted-foreground"
                  : isSelected
                    ? "border-primary bg-brandSecondary text-foreground"
                    : "border-gray-200 bg-white text-foreground hover:border-gray-300";

                return (
                  <button
                    key={choice}
                    type="button"
                    disabled={graded}
                    onClick={() => setSelected(index)}
                    className={`flex min-h-14 w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm font-medium transition-colors ${resultClass}`}
                  >
                    <span
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${
                        graded && isAnswer
                          ? "border-green-500 bg-green-500 text-white"
                          : graded && isSelected
                            ? "border-red-400 bg-red-400 text-white"
                            : isSelected
                              ? "border-primary bg-primary text-white"
                              : "border-gray-300 text-muted-foreground"
                      }`}
                    >
                      {graded && isAnswer ? (
                        <Check className="h-4 w-4" aria-hidden="true" />
                      ) : graded && isSelected ? (
                        <X className="h-4 w-4" aria-hidden="true" />
                      ) : (
                        index + 1
                      )}
                    </span>
                    <span>{choice}</span>
                  </button>
                );
              })}
            </div>

            {graded && (
              <div className="mt-6 border-t border-gray-100 pt-6">
                <div className="rounded-xl bg-gray-50 p-4">
                  <p className="text-sm font-bold text-foreground">정답 해설</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {currentQuestion.explanation}
                  </p>
                </div>
                <div className="mt-4 space-y-2">
                  {currentQuestion.choiceExplanations.map(
                    (explanation, index) => (
                      <div
                        key={explanation}
                        className="flex gap-2 text-xs leading-5 text-muted-foreground"
                      >
                        <span className="font-bold text-foreground">
                          {index + 1}.
                        </span>
                        <span>{explanation}</span>
                      </div>
                    ),
                  )}
                </div>
              </div>
            )}
          </section>

          <div className="mt-5 flex gap-2">
            {!graded ? (
              <>
                <button
                  type="button"
                  onClick={() => gradeAnswer(true)}
                  className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white text-sm font-semibold text-muted-foreground"
                >
                  <CircleHelp className="h-4 w-4" aria-hidden="true" />
                  모르겠어요
                </button>
                <button
                  type="button"
                  onClick={() => gradeAnswer(false)}
                  disabled={selected === null}
                  className="h-12 flex-[1.6] rounded-xl bg-primary text-sm font-bold text-white disabled:bg-gray-300"
                >
                  채점하기
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={goNext}
                className="h-12 w-full rounded-xl bg-primary text-sm font-bold text-white"
              >
                {attempt.currentIndex === activeQuestions.length - 1
                  ? "결과 확인"
                  : "다음 문제"}
              </button>
            )}
          </div>
        </main>
      )}

      {stage === "result" && attempt && (
        <main className="px-5 py-8 md:px-10 md:py-10">
          <section className="text-center">
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brandSecondary text-primary">
              <Trophy className="h-8 w-8" aria-hidden="true" />
            </span>
            <p className="mt-5 text-sm font-semibold text-primary">학습 완료</p>
            <h1 className="mt-1 text-2xl font-bold text-foreground">
              {accuracy}점
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {activeQuestions.length}문제 중 {correctCount}문제를 맞혔어요.
            </p>
          </section>

          <section className="mt-7 grid grid-cols-3 divide-x divide-gray-200 rounded-2xl border border-gray-200 bg-white py-5 shadow-sm">
            {[
              ["정답", correctCount, "text-green-600"],
              [
                "오답",
                attempt.answers.length - correctCount - unknownCount,
                "text-red-500",
              ],
              ["모름", unknownCount, "text-muted-foreground"],
            ].map(([label, value, className]) => (
              <div key={String(label)} className="text-center">
                <p className={`text-xl font-bold ${className}`}>{value}</p>
                <p className="mt-1 text-xs text-muted-foreground">{label}</p>
              </div>
            ))}
          </section>

          <section className="mt-5 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-bold text-foreground">주제별 결과</h2>
            <div className="mt-4 space-y-4">
              {[
                ...new Set(
                  activeQuestions.map((question) => question.subtopic),
                ),
              ].map((item) => {
                const topicQuestions = activeQuestions.filter(
                  (question) => question.subtopic === item,
                );
                const topicAnswers = attempt.answers.filter((answer) =>
                  topicQuestions.some(
                    (question) => question.id === answer.questionId,
                  ),
                );
                const topicCorrect = topicAnswers.filter(
                  (answer) => answer.isCorrect,
                ).length;
                const percent = topicAnswers.length
                  ? Math.round((topicCorrect / topicAnswers.length) * 100)
                  : 0;
                return (
                  <div key={item}>
                    <div className="flex items-center justify-between text-sm">
                      <p className="font-semibold text-foreground">{item}</p>
                      <p className="font-bold text-primary">{percent}%</p>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-100">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <div className="mt-5 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={reset}
              className="h-12 rounded-xl border border-gray-300 bg-white text-sm font-bold text-foreground"
            >
              다시 풀기
            </button>
            <button
              type="button"
              onClick={() => router.push("/questionbank")}
              className="h-12 rounded-xl bg-primary text-sm font-bold text-white"
            >
              문제은행 홈
            </button>
            <button
              type="button"
              onClick={() =>
                router.push(
                  `/questionbank/review?category=HANDCRAFTED&collection=${encodeURIComponent(`handcrafted:${attempt?.id}`)}`,
                )
              }
              className="col-span-2 h-12 rounded-xl border border-primary text-sm font-bold text-primary"
            >
              복습하기
            </button>
          </div>
        </main>
      )}
    </AppShell>
  );
}
