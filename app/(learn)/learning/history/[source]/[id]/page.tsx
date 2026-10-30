"use client";
import { use, useState } from "react";
import { PracticeHeader } from "@/components/molecules/PracticeHeader";
import { Button } from "@/components/ui/button";
import {
  HISTORY_FILTERS,
  historyAccuracy,
  type HistoryFilter,
} from "@/lib/learning/history";
import { useLearningHistoryDetail } from "@/hooks/queries/useLearningHistory";
import { ConfusionToggle } from "@/components/learning/ConfusionToggle";
import type { ReviewSource } from "@/types/review";
export default function HistoryDetailPage({
  params,
}: {
  params: Promise<{ source: string; id: string }>;
}) {
  const { source, id } = use(params);
  const [filter, setFilter] = useState<HistoryFilter>("all");
  const query = useLearningHistoryDetail(source, id, filter);
  return (
    <div className="mx-auto min-h-dvh max-w-screen-sm bg-white">
      <PracticeHeader title="학습 기록 상세" backHref="/learning/history" />
      <main className="space-y-6 px-6 py-6" aria-busy={query.isPending}>
        {query.data && (
          <section>
            <h1 className="text-headline-medium">{query.data.attempt.title}</h1>
            <p className="mt-2 text-body-medium">
              총 {query.data.attempt.questionCount}문제 · 정답{" "}
              {query.data.attempt.correctCount} · 오답{" "}
              {query.data.attempt.wrongCount} · 헷갈림{" "}
              {query.data.attempt.confusedCount} · 정답률{" "}
              {historyAccuracy(query.data.attempt)}%
            </p>
          </section>
        )}
        <div className="flex flex-wrap gap-2">
          {Object.entries(HISTORY_FILTERS).map(([key, label]) => (
            <Button
              key={key}
              aria-pressed={filter === key}
              variant={filter === key ? "default" : "outline"}
              onClick={() => setFilter(key as HistoryFilter)}
            >
              {label}
            </Button>
          ))}
        </div>
        {query.isPending && (
          <p role="status">결과와 해설을 불러오는 중이에요.</p>
        )}
        {query.isError && (
          <p role="alert">
            완료한 학습 기록을 확인하지 못했어요.{" "}
            <button className="underline" onClick={() => void query.refetch()}>
              다시 시도
            </button>
          </p>
        )}
        {query.data?.questions.length === 0 && (
          <p className="rounded-xl bg-accent p-4">
            표시할 문제가 없어요. 다른 조건을 선택해주세요.
          </p>
        )}
        {query.data?.questions.map((q, index) => (
          <article
            key={q.questionId}
            className="space-y-3 rounded-xl border border-border p-4"
          >
            <p className="text-body-small text-primary">
              {[q.subject, q.topic].filter(Boolean).join(" · ")}
            </p>
            <h2 className="whitespace-pre-wrap text-title-large">
              {index + 1}. {q.content}
            </h2>
            {q.referenceContent && (
              <p className="whitespace-pre-wrap rounded-xl bg-accent p-3 text-body-medium">
                {q.referenceContent}
              </p>
            )}
            {q.media?.map(
              (media, i) =>
                media.url && (
                  <img
                    key={i}
                    src={media.url}
                    alt={`문항 자료 ${i + 1}`}
                    className="max-w-full"
                  />
                ),
            )}
            <p className="text-body-medium">
              {q.outcome === "CORRECT"
                ? "정답"
                : q.outcome === "INCORRECT"
                  ? "오답"
                  : q.outcome === "REVEALED"
                    ? "정답 확인"
                    : "미응답"}
              {q.confused ? " · 헷갈림" : ""}
            </p>
            <div className="space-y-2">
              {q.choices.map((choice, n) => (
                <div
                  key={choice.id}
                  className={`rounded-xl border p-3 text-body-medium ${choice.id === q.correctAnswer ? "border-primary bg-primary-980" : "border-border"}`}
                >
                  <p>
                    {n + 1}. {choice.text}
                    {choice.id === q.userAnswer ? " (내 답안)" : ""}
                  </p>
                  {choice.explanation && (
                    <p className="mt-2 whitespace-pre-wrap text-muted-foreground">
                      {choice.explanation}
                    </p>
                  )}
                </div>
              ))}
            </div>
            <p className="text-body-medium">
              내 답안: {q.userAnswer || "미응답"} · 정답: {q.correctAnswer}
            </p>
            <div className="whitespace-pre-wrap rounded-xl bg-accent p-4 text-body-medium">
              <strong>전체 해설</strong>
              <p className="mt-2">{q.explanation || "등록된 해설이 없어요."}</p>
            </div>
            <ConfusionToggle
              source={source as ReviewSource}
              questionId={q.questionId}
            />
          </article>
        ))}
      </main>
    </div>
  );
}
