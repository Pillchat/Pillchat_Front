"use client";
import { ConfusionToggle } from "@/components/learning/ConfusionToggle";
import WeaknessReviewFeedback from "@/components/learning/WeaknessReviewFeedback";
import { useEffect, useRef, useState } from "react";
import { fetchAPI } from "@/lib/client/fetch";
import { LearningCommands } from "@/lib/learning/api";
import { CustomHeader } from "@/components/molecules";
import { SolidButton } from "@/components/atoms";
import { LoadingIndicator } from "@/components/atoms/LoadingIndicator";
import ChoiceItem from "@/app/(questionbank)/questionbank/_components/ChoiceItem";
import { ReviewExplanation } from "@/app/(questionbank)/questionbank/_components/ReviewPlayerFrame";
import AiPracticeResult from "@/components/learning/AiPracticeResult";
import type { QuizResultResponse } from "@/types/questionbank";
import Link from "next/link";

type Answer = {
  questionId: string;
  userAnswer?: string;
  correctAnswer?: string;
  explanation?: string;
  action: string;
  isCorrect: boolean;
};
type Quiz = {
  type?: string;
  sessionId: string;
  status: string;
  questions: {
    questionId: string;
    type: string;
    subject: string;
    content: string;
    hint?: string;
    choices: string[] | null;
  }[];
  answers: Answer[];
};
export default function AiSessionPage() {
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [index, setIndex] = useState(0);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<QuizResultResponse | null>(null);
  const [showHint, setShowHint] = useState(false);
  const firstLoad = useRef(true);
  const commands = useRef(new LearningCommands());
  const lock = useRef(false);
  const id = useRef("");
  const load = async () => {
    const value: Quiz = await fetchAPI(
      `/api/questionbank/quiz/${encodeURIComponent(id.current)}?resume=true`,
      "GET",
    );
    setQuiz(value);
    if (firstLoad.current) {
      const unanswered = value.questions.findIndex(
        (q) => !value.answers.some((a) => a.questionId === q.questionId),
      );
      setIndex(Math.max(0, unanswered));
      firstLoad.current = false;
    }
    if (value.status === "FINISHED")
      setResult(
        await fetchAPI(
          `/api/questionbank/quiz/${encodeURIComponent(id.current)}`,
          "GET",
        ),
      );
  };
  useEffect(() => {
    id.current =
      new URLSearchParams(window.location.search).get("session") ?? "";
    if (!id.current) {
      setError("응시 정보가 없습니다.");
      return;
    }
    void load().catch((e) => setError(e.message));
  }, []);
  const act = async (action: "ANSWER" | "REVEAL" | "finish", retry = false) => {
    if (lock.current || !quiz) return;
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      if (retry) await commands.current.retry();
      else
        await commands.current.send(
          `/api/questionbank/quiz/${id.current}`,
          "POST",
          action === "finish"
            ? { action }
            : {
                action,
                questionId: quiz.questions[index].questionId,
                ...(action === "ANSWER" ? { userAnswer: input } : {}),
              },
        );
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "요청에 실패했습니다.");
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };
  const q = quiz?.questions[index];
  const answer = quiz?.answers.find((a) => a.questionId === q?.questionId);
  const disabled = busy || !!commands.current.pending;
  if (result) return <AiPracticeResult result={result} />;
  const move = (next: number) => {
    setIndex(next);
    setInput("");
    setShowHint(false);
  };
  const reload = async () => {
    if (!id.current || busy) return;
    setBusy(true);
    setError("");
    try {
      await load();
    } catch {
      setError("응시 정보를 불러오지 못했어요. 다시 시도해 주세요.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="flex h-dvh min-w-0 flex-col bg-white">
      <CustomHeader title="AI 문제 풀이" showIcon />
      <div className="min-h-0 flex-1 overflow-y-auto">
        {error && (
          <div
            role="alert"
            className="mx-6 my-4 space-y-3 rounded-xl bg-red-50 p-4 text-sm text-red-700"
          >
            <p>{error}</p>
            {commands.current.pending ? (
              <button
                type="button"
                disabled={busy}
                onClick={() => void act("ANSWER", true)}
                className="font-semibold underline"
              >
                같은 요청 다시 전송
              </button>
            ) : (
              <button
                type="button"
                disabled={busy}
                onClick={() => void reload()}
                className="font-semibold underline"
              >
                다시 불러오기
              </button>
            )}
            {!id.current && (
              <Link href="/questionbank" className="block underline">
                문제 풀기로 돌아가기
              </Link>
            )}
          </div>
        )}
        {q ? (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-3">
              <p className="text-sm font-semibold">
                문제 {index + 1}/{quiz!.questions.length} · {q.subject}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={disabled || index === 0}
                  onClick={() => move(index - 1)}
                  className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white disabled:bg-gray-50 disabled:text-gray-300"
                >
                  이전 문제
                </button>
                {q.hint && (
                  <button
                    type="button"
                    onClick={() => setShowHint((v) => !v)}
                    className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs"
                  >
                    힌트 보기
                  </button>
                )}
              </div>
            </div>
            {showHint && q.hint && (
              <p className="mx-6 rounded-lg bg-amber-50 p-4 text-sm text-amber-800">
                {q.hint}
              </p>
            )}
            <main className="space-y-4 px-6 py-4">
              <h1 className="whitespace-pre-wrap text-base font-medium leading-relaxed">
                {q.content}
              </h1>
              {quiz?.type !== "REVIEW" && (
                <ConfusionToggle
                  key={`${q.questionId}:${!!answer}`}
                  source="AI"
                  questionId={q.questionId}
                  disabled={disabled}
                />
              )}
              {q.type === "MULTIPLE_CHOICE" || q.type === "TRUE_FALSE" ? (
                <fieldset disabled={disabled} className="space-y-3">
                  {(q.type === "TRUE_FALSE"
                    ? ["O", "X"]
                    : (q.choices ?? [])
                  ).map((choice, n) => (
                    <ChoiceItem
                      key={`${n}:${choice}`}
                      choice={{
                        id:
                          q.type === "TRUE_FALSE"
                            ? choice
                            : String.fromCharCode(65 + n),
                        text: choice,
                      }}
                      isSelected={(answer?.userAnswer ?? input) === choice}
                      gradingState={
                        answer ? "graded" : input ? "answered" : "unanswered"
                      }
                      isCorrectChoice={answer?.correctAnswer === choice}
                      onClick={() => setInput(choice)}
                    />
                  ))}
                </fieldset>
              ) : (
                <textarea
                  aria-label="답안"
                  maxLength={500}
                  className="min-h-24 w-full rounded-xl border p-4 text-sm"
                  value={answer?.userAnswer ?? input}
                  disabled={disabled || !!answer}
                  onChange={(e) => setInput(e.target.value)}
                />
              )}
              {answer && quiz?.type === "REVIEW" && (
                <WeaknessReviewFeedback
                  key={q.questionId}
                  source="AI"
                  questionId={q.questionId}
                  disabled={disabled}
                />
              )}
            </main>
            {answer && (
              <ReviewExplanation
                correct={answer.isCorrect}
                correctAnswer={answer.correctAnswer ?? ""}
                explanation={answer.explanation ?? ""}
              />
            )}
          </>
        ) : (
          !error && (
            <LoadingIndicator
              label="응시 정보를 불러오는 중..."
              className="py-20"
            />
          )
        )}
      </div>
      {q && (
        <footer className="shrink-0 space-y-3 border-t bg-white px-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-3">
          {!answer && (
            <button
              type="button"
              disabled={disabled}
              onClick={() => void act("REVEAL")}
              className="w-full text-center text-sm text-muted-foreground underline disabled:opacity-50"
            >
              잘 모르겠어요
            </button>
          )}
          <SolidButton
            content={
              answer
                ? index + 1 === quiz!.questions.length
                  ? "결과보기"
                  : "다음 문제"
                : "채점하기"
            }
            disabled={disabled || (!answer && !input.trim())}
            variant={
              disabled || (!answer && !input.trim()) ? "disabled" : "brand"
            }
            onClick={() => {
              if (!answer) void act("ANSWER");
              else if (index + 1 < quiz!.questions.length) move(index + 1);
              else void act("finish");
            }}
          />
          <button
            type="button"
            disabled={disabled}
            className="w-full text-center text-xs text-muted-foreground"
            onClick={() => {
              if (confirm("미응답 문제를 포함하여 응시를 종료할까요?"))
                void act("finish");
            }}
          >
            종료 및 결과
          </button>
        </footer>
      )}
    </div>
  );
}
