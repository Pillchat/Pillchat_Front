"use client";

import { TutorialButton } from "@/components/learning/TutorialButton";
import { useEffect, useState } from "react";
import { Bookmark, BookmarkCheck, Check, X, CircleHelp } from "lucide-react";
import { AppShell, PracticeHeader } from "@/components/molecules";
import { LoadingIndicator } from "@/components/atoms/LoadingIndicator";
import type { LearningSession } from "@/hooks/useLearningSession";
import HandcraftedTutorial from "@/app/(questionbank)/questionbank/handcrafted/_components/HandcraftedTutorial";
import { SessionFeedback } from "./SessionFeedback";
import HandcraftedSetup from "./HandcraftedSetup";
export default function HandcraftedPractice({
  session: s,
}: {
  session: LearningSession;
}) {
  const [tutorial, setTutorial] = useState(false);
  const attempt = s.attempt;
  const question = attempt?.currentSectionQuestions[s.index];
  const answer = attempt?.savedAnswers.find(
    (a) => a.attemptQuestionId === question?.attemptQuestionId,
  );
  const grade = question ? s.grades[question.attemptQuestionId] : undefined;
  const locked =
    s.disabled || attempt?.state !== "IN_PROGRESS" || !!answer?.finalized;
  const completed = attempt?.state === "COMPLETED";
  useEffect(() => {
    if (completed && !s.loading && !s.disabled) void s.leave();
  }, [completed, s.loading, s.disabled, s.leave]);
  const next = async () => {
    if (!attempt) return;
    if (s.index + 1 < attempt.currentSectionQuestions.length)
      await s.navigate(
        attempt.currentSectionQuestions[s.index + 1].attemptQuestionId,
      );
    else if (attempt.state === "IN_PROGRESS") await s.submitSection();
  };
  return (
    <AppShell className="min-h-dvh bg-white">
      {tutorial && <HandcraftedTutorial onClose={() => setTutorial(false)} />}
      <PracticeHeader
        title="수제 제작 문제"
        subtitle="전문가 제작 · 검수 완료"
        backHref="/questionbank"
        onBack={attempt ? () => void s.leave() : undefined}
        rightSlot={<TutorialButton onClick={() => setTutorial(true)} />}
      />
      <SessionFeedback session={s} />
      {s.loading ? (
        <LoadingIndicator label="문제를 불러오는 중..." className="py-20" />
      ) : completed ? (
        <LoadingIndicator
          label="시작 화면으로 돌아가는 중..."
          className="py-20"
        />
      ) : !attempt ? (
        <HandcraftedSetup session={s} />
      ) : question && answer ? (
        <main className="px-5 py-6 md:px-10 md:py-8">
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm font-semibold">
              {s.index + 1} / {attempt.currentSectionQuestions.length}
            </p>
            <p className="text-xs font-medium text-muted-foreground">
              {question.subjectName}
            </p>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-full rounded-full bg-primary transition-[width]"
              style={{
                width: `${((s.index + 1) / attempt.currentSectionQuestions.length) * 100}%`,
              }}
            />
          </div>
          <section className="mt-5 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm md:p-8">
            <div className="flex items-start justify-between gap-4">
              <span className="flex h-8 min-w-8 items-center justify-center rounded-lg bg-brandSecondary px-2 text-sm font-bold text-primary">
                Q{s.index + 1}
              </span>
              <button
                type="button"
                disabled={s.disabled}
                onClick={() =>
                  void s.bookmark(
                    question.attemptQuestionId,
                    !s.bookmarks[question.sourceQuestionVersionId],
                  )
                }
                aria-label={
                  s.bookmarks[question.sourceQuestionVersionId]
                    ? "북마크 해제"
                    : "북마크"
                }
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-muted-foreground"
              >
                {s.bookmarks[question.sourceQuestionVersionId] ? (
                  <BookmarkCheck className="h-5 w-5 text-primary" />
                ) : (
                  <Bookmark className="h-5 w-5" />
                )}
              </button>
            </div>
            {question.referenceContent && (
              <p className="mt-5 whitespace-pre-wrap rounded-xl bg-gray-50 p-4 text-sm">
                {question.referenceContent}
              </p>
            )}
            <h1 className="mt-5 whitespace-pre-wrap text-lg font-bold leading-8 md:text-xl">
              {question.stem}
            </h1>
            {question.media?.map(
              (m, i) =>
                (m.url ?? m.downloadUrl) && (
                  <img
                    key={i}
                    src={m.url ?? m.downloadUrl}
                    alt={m.alt ?? "문항 자료"}
                    className="mt-4 max-w-full"
                  />
                ),
            )}
            <div className="mt-6 space-y-3">
              {question.choices.map((choice, index) => {
                const correct = grade?.correctChoiceId === choice.choiceId;
                const selected = answer.selectedChoiceId === choice.choiceId;
                const resultClass = grade
                  ? correct
                    ? "border-green-500 bg-green-50 text-green-900"
                    : selected
                      ? "border-red-400 bg-red-50 text-red-900"
                      : "border-gray-200 text-muted-foreground"
                  : selected
                    ? "border-primary bg-brandSecondary"
                    : "border-gray-200 hover:border-gray-300";
                return (
                  <button
                    key={choice.choiceId}
                    type="button"
                    disabled={locked}
                    aria-pressed={selected}
                    onClick={() =>
                      void s.writeAnswers(question.attemptQuestionId, {
                        selectedChoiceId: choice.choiceId,
                      })
                    }
                    className={`flex min-h-14 w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm font-medium ${resultClass}`}
                  >
                    <span
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${grade && correct ? "border-green-500 bg-green-500 text-white" : grade && selected ? "border-red-400 bg-red-400 text-white" : selected ? "border-primary bg-primary text-white" : "border-gray-300 text-muted-foreground"}`}
                    >
                      {grade && correct ? (
                        <Check className="h-4 w-4" />
                      ) : grade && selected ? (
                        <X className="h-4 w-4" />
                      ) : (
                        index + 1
                      )}
                    </span>
                    <span className="whitespace-pre-wrap">{choice.text}</span>
                  </button>
                );
              })}
            </div>
            {grade && (
              <div className="mt-6 border-t border-gray-100 pt-6">
                <div className="rounded-xl bg-gray-50 p-4">
                  <p className="text-sm font-bold">정답 해설</p>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                    {grade.explanation}
                  </p>
                </div>
                <div className="mt-4 space-y-2">
                  {grade.choices?.map((choice, index) => (
                    <p
                      key={choice.choiceId}
                      className="whitespace-pre-wrap text-xs leading-5 text-muted-foreground"
                    >
                      {index + 1}. {choice.explanation}
                    </p>
                  ))}
                </div>
              </div>
            )}
            {answer.finalized && !grade && (
              <p className="mt-5 text-sm text-muted-foreground">
                이미 채점한 문제입니다. 공개된 결과에서 해설을 확인할 수 있어요.
              </p>
            )}
          </section>
          <div className="mt-5 flex gap-2">
            {!answer.finalized && attempt.state === "IN_PROGRESS" ? (
              <>
                <button
                  type="button"
                  disabled={s.disabled}
                  onClick={() => void s.grade(true)}
                  className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl border border-gray-300 text-sm font-semibold text-muted-foreground"
                >
                  <CircleHelp className="h-4 w-4" />
                  모르겠어요
                </button>
                <button
                  type="button"
                  disabled={s.disabled || !answer.selectedChoiceId}
                  onClick={() => void s.grade(false)}
                  className="h-12 flex-[1.6] rounded-xl bg-primary text-sm font-bold text-white disabled:bg-gray-300"
                >
                  채점하기
                </button>
              </>
            ) : (
              <button
                type="button"
                disabled={
                  s.disabled ||
                  (s.index === attempt.currentSectionQuestions.length - 1 &&
                    attempt.state !== "IN_PROGRESS")
                }
                onClick={() => void next()}
                className="h-12 w-full rounded-xl bg-primary text-sm font-bold text-white disabled:bg-gray-300"
              >
                {s.index === attempt.currentSectionQuestions.length - 1
                  ? "학습 마치기"
                  : "다음 문제"}
              </button>
            )}
          </div>
        </main>
      ) : (
        <div className="p-6">
          <p>현재 문제 또는 답안을 찾지 못하였습니다.</p>
          <button
            type="button"
            disabled={s.disabled}
            onClick={() => void s.leave()}
            className="mt-4 text-primary"
          >
            돌아가기
          </button>
        </div>
      )}
    </AppShell>
  );
}
