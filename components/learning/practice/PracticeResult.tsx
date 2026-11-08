"use client";
import { useWeaknessQuery } from "@/hooks/queries/useWeaknessQuery";
import { ConfusionToggle } from "@/components/learning/ConfusionToggle";
import WeaknessReviewFeedback from "@/components/learning/WeaknessReviewFeedback";
import { useEffect, useRef, useState } from "react";
import ResultActions from "@/components/learning/ResultActions";
import { Trophy } from "lucide-react";
import { AppShell, PracticeHeader } from "@/components/molecules";
import type { LearningSession } from "@/hooks/useLearningSession";
import { SessionFeedback } from "./SessionFeedback";
import { TutorialButton } from "@/components/learning/TutorialButton";
import { choiceExplanations } from "@/lib/learning/presentation";
export function PracticeResult({
  session: s,
  onTutorial,
}: {
  session: LearningSession;
  onTutorial: () => void;
}) {
  const weakness = useWeaknessQuery();
  const [onlyWrong, setOnlyWrong] = useState(true);
  const [explanationsOpen, setExplanationsOpen] = useState(false);
  const [reviewRequest, setReviewRequest] = useState(0);
  const explanationsRef = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    if (reviewRequest === 0) return;
    explanationsRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, [reviewRequest]);
  if (!s.result) return null;
  const result = s.result;
  const wrongCount = result.questions.filter(
    (item) => item.grade.outcome !== "CORRECT",
  ).length;
  const reviewWrong = () => {
    setOnlyWrong(true);
    setExplanationsOpen(true);
    setReviewRequest((request) => request + 1);
  };
  const cbt = s.source === "CBT";
  const groups = Object.entries(
    result.questions.reduce<Record<string, { correct: number; total: number }>>(
      (acc, item) => {
        const group = (acc[
          item.question.topicName || item.question.subjectName
        ] ??= {
          correct: 0,
          total: 0,
        });
        group.total++;
        if (item.grade.outcome === "CORRECT") group.correct++;
        return acc;
      },
      {},
    ),
  );
  const confusedCount = result.questions.filter((item) =>
    weakness.data?.questions.some(
      (q) =>
        q.source === s.source &&
        q.questionId === item.question.sourceQuestionVersionId &&
        q.confused,
    ),
  ).length;
  const body = (
    <>
      <SessionFeedback session={s} />
      <main
        className={
          cbt
            ? "mx-auto max-w-[960px] px-4 pb-8 pt-8 sm:px-6"
            : "px-5 py-8 md:px-10 md:py-10"
        }
      >
        {cbt ? (
          <>
            <p className="text-sm font-bold text-primary">
              {s.attempt?.mode === "FULL" ? "전체 실전 종합 결과" : "교시 결과"}
            </p>
            <h1 className="mt-2 text-2xl font-extrabold text-primary sm:text-3xl">
              연습을 완료했어요
            </h1>
          </>
        ) : (
          <section className="text-center">
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brandSecondary text-primary">
              <Trophy className="h-8 w-8" />
            </span>
            <p className="mt-5 text-sm font-semibold text-primary">학습 완료</p>
            <h1 className="mt-1 text-2xl font-bold">{result.score}점</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {result.counts.total}문제 중 {result.counts.correct}문제를
              맞혔어요.
            </p>
          </section>
        )}
        <section
          className={
            cbt
              ? "mt-6 rounded-2xl bg-accent p-6"
              : "mt-7 rounded-2xl bg-gray-50 py-5"
          }
        >
          {cbt && (
            <div className="flex items-end justify-between">
              <strong className="text-4xl font-extrabold text-primary">
                {result.score}점
              </strong>
              <span className="text-sm text-muted-foreground">
                총 {result.counts.total}문항
              </span>
            </div>
          )}
          <div
            className={`grid grid-cols-2 gap-2 sm:grid-cols-4 ${cbt ? "mt-6" : ""}`}
          >
            {[
              ["정답", result.counts.correct, "text-green-600"],
              ["오답", result.counts.incorrect, "text-red-500"],
              ["미응답", result.counts.unanswered, "text-muted-foreground"],
              [
                "헷갈림",
                weakness.isPending || weakness.isError ? "–" : confusedCount,
                "text-primary",
              ],
            ].map(([label, value, color]) => (
              <div key={label} className="rounded-xl p-3 text-center">
                <strong className={`text-xl font-bold ${color}`}>
                  {value}
                </strong>
                <span className="mt-1 block text-xs text-muted-foreground">
                  {label}
                </span>
              </div>
            ))}
          </div>
        </section>
        {groups.length > 0 && (
          <section className="mt-7 rounded-2xl bg-gray-50 p-5">
            <h2 className="font-bold">세부주제별 결과</h2>
            <div className="mt-4 space-y-4">
              {groups.map(([subject, counts]) => (
                <div key={subject}>
                  <div className="flex items-start justify-between gap-3 text-sm">
                    <span className="min-w-0 font-semibold">{subject}</span>
                    <span className="shrink-0 font-bold text-primary">
                      {counts.correct}/{counts.total}
                    </span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{
                        width: `${counts.total ? (counts.correct / counts.total) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
        <p className="my-4 text-center text-sm text-muted-foreground">
          정답률 {result.score}% · 틀린 문제와 풀이 중 ‘헷갈려요’를 직접 표시한
          문제는 약점공략에서 복습해요.
        </p>
        <ResultActions
          review={s.attempt?.mode === "REVIEW"}
          wrongCount={wrongCount}
          onReviewWrong={reviewWrong}
          masteredAvailable={
            !weakness.isError &&
            !!weakness.data?.questions.some((q) => q.status === "MASTERED")
          }
        />
        <details
          ref={explanationsRef}
          open={explanationsOpen}
          onToggle={(event) => setExplanationsOpen(event.currentTarget.open)}
          className="mt-5 scroll-mt-24 rounded-xl bg-gray-50 p-4"
        >
          <summary className="cursor-pointer font-semibold">
            문제별 해설
          </summary>
          <section className="mt-5 space-y-4">
            <div className="flex gap-2">
              {[true, false].map((value) => (
                <button
                  key={String(value)}
                  type="button"
                  onClick={() => setOnlyWrong(value)}
                  className={`rounded-full px-4 py-2 text-sm ${onlyWrong === value ? "bg-primary text-white" : "bg-white text-muted-foreground"}`}
                >
                  {value ? "오답·미응답" : "전체 문제"}
                </button>
              ))}
            </div>
            {result.questions
              .filter((item) => !onlyWrong || item.grade.outcome !== "CORRECT")
              .map((item) => (
                <article
                  key={item.question.attemptQuestionId}
                  className="rounded-2xl bg-white p-5"
                >
                  <p className="text-xs text-primary">
                    {item.question.subjectName}
                  </p>
                  <h3 className="mt-3 whitespace-pre-wrap font-bold">
                    {item.question.stem}
                  </h3>
                  {s.attempt?.mode === "REVIEW" ? (
                    <WeaknessReviewFeedback
                      source={s.source}
                      questionId={item.question.sourceQuestionVersionId}
                      disabled={s.disabled}
                    />
                  ) : (
                    <ConfusionToggle
                      source={s.source}
                      questionId={item.question.sourceQuestionVersionId}
                      disabled={s.disabled}
                    />
                  )}
                  {item.question.referenceContent && (
                    <p className="mt-3 whitespace-pre-wrap rounded-xl bg-muted p-3">
                      {item.question.referenceContent}
                    </p>
                  )}
                  {item.question.media?.map(
                    (m, i) =>
                      (m.url ?? m.downloadUrl) && (
                        <img
                          key={i}
                          src={m.url ?? m.downloadUrl}
                          alt={m.alt ?? "문항 자료"}
                          className="mt-3 max-w-full"
                        />
                      ),
                  )}
                  <div className="mt-4 space-y-2">
                    {item.question.choices.map((choice, i) => (
                      <p
                        key={choice.choiceId}
                        className={`whitespace-pre-wrap rounded-xl p-3 text-sm ${choice.choiceId === item.grade.correctChoiceId ? "bg-green-50" : choice.choiceId === item.answer.selectedChoiceId ? "bg-red-50" : "bg-gray-50"}`}
                      >
                        {i + 1}. {choice.text}
                      </p>
                    ))}
                  </div>
                  <div className="mt-4 rounded-xl bg-gray-50 p-4">
                    <p className="font-bold">정답 해설</p>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6">
                      {item.grade.explanation}
                    </p>
                    {choiceExplanations(item.question, item.grade).map(
                      (choice) => (
                        <p
                          key={choice.choiceId}
                          className="mt-2 whitespace-pre-wrap text-xs text-muted-foreground"
                        >
                          {choice.number}. {choice.explanation}
                        </p>
                      ),
                    )}
                  </div>
                </article>
              ))}
            {onlyWrong &&
              !result.questions.some(
                (item) => item.grade.outcome !== "CORRECT",
              ) && (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  오답·미응답 문제가 없습니다.
                </p>
              )}
          </section>
        </details>
      </main>
    </>
  );
  return cbt ? (
    <div className="min-h-dvh bg-white">
      <PracticeHeader
        title={s.attempt?.mode === "REVIEW" ? "약점공략 결과" : "CBT 학습 결과"}
        onBack={() => void s.leave()}
        rightSlot={<TutorialButton onClick={onTutorial} />}
      />
      {body}
    </div>
  ) : (
    <AppShell>
      <PracticeHeader
        title={
          s.attempt?.mode === "REVIEW" ? "약점공략 결과" : "수제 제작 문제"
        }
        onBack={() => void s.leave()}
        rightSlot={<TutorialButton onClick={onTutorial} />}
      />
      {body}
    </AppShell>
  );
}
