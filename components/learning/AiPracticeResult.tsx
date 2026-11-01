"use client";
import Link from "next/link";
import { CustomHeader } from "@/components/molecules";
import DonutChart from "@/app/(questionbank)/questionbank/_components/DonutChart";
import StatsCard from "@/app/(questionbank)/questionbank/_components/StatsCard";
import { ReviewExplanation } from "@/app/(questionbank)/questionbank/_components/ReviewPlayerFrame";
import { useWeaknessQuery } from "@/hooks/queries/useWeaknessQuery";
import { ConfusionToggle } from "./ConfusionToggle";
import type { QuizResultResponse } from "@/types/questionbank";

export default function AiPracticeResult({
  result,
}: {
  result: QuizResultResponse;
}) {
  const weakness = useWeaknessQuery();
  const confused = new Set(
    weakness.data?.questions
      .filter((q) => q.source === "AI" && q.confused)
      .map((q) => String(q.questionId)) ?? [],
  );
  const confusedCount = result.answers.filter((a) =>
    confused.has(String(a.questionId)),
  ).length;
  const topics = new Map<string, { total: number; wrong: number }>();
  for (const answer of result.answers) {
    const topic = topics.get(answer.subject) ?? { total: 0, wrong: 0 };
    topic.total++;
    if (!answer.isCorrect || confused.has(String(answer.questionId)))
      topic.wrong++;
    topics.set(answer.subject, topic);
  }
  const weakTopics = [...topics]
    .filter(([, topic]) => topic.wrong > 0)
    .sort((a, b) => b[1].wrong / b[1].total - a[1].wrong / a[1].total);
  return (
    <div className="min-h-dvh bg-white pb-8">
      <CustomHeader title="학습 결과" />
      <main className="space-y-6 px-6 py-6">
        <div className="flex justify-center">
          <DonutChart percentage={result.scorePercent} />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <StatsCard label="총 문제" value={result.questionCount} />
          <StatsCard label="정답" value={result.correctCount} color="green" />
          <StatsCard
            label="오답"
            value={result.questionCount - result.correctCount}
            color="red"
          />
        </div>
        <StatsCard
          label="헷갈림 표시"
          value={
            weakness.isPending
              ? "–"
              : weakness.isError
                ? "확인 필요"
                : confusedCount
          }
        />
        {weakness.isError && (
          <button
            type="button"
            onClick={() => void weakness.refetch()}
            className="text-sm text-primary"
          >
            헷갈림 현황 다시 불러오기
          </button>
        )}
        <section className="space-y-3">
          <h2 className="font-semibold">취약 분야</h2>
          {weakTopics.length ? (
            weakTopics.map(([name, value]) => (
              <div
                key={name}
                className="flex justify-between gap-3 rounded-xl bg-gray-50 p-4 text-sm"
              >
                <span>{name}</span>
                <span className="shrink-0 text-primary">
                  {value.wrong}/{value.total}문제
                </span>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">
              이번 학습에서 확인된 약점이 없어요.
            </p>
          )}
        </section>
        <div className="grid grid-cols-2 gap-3">
          <Link
            href="/learning/weakness"
            className="flex min-h-[58px] items-center justify-center rounded-xl bg-primary px-3 text-center font-semibold text-white"
          >
            오답·헷갈림 복습하기
          </Link>
          <Link
            href={
              result.type === "PDF"
                ? "/questionbank/generate"
                : "/questionbank/premium"
            }
            className="flex min-h-[58px] items-center justify-center rounded-xl border px-3 text-center font-semibold"
          >
            새 문제 생성하기
          </Link>
        </div>
        <section className="space-y-3">
          <h2 className="font-semibold">문제별 해설</h2>
          {result.answers.map((answer, index) => (
            <details
              key={answer.questionId}
              className="overflow-hidden rounded-xl border"
            >
              <summary className="cursor-pointer p-4 text-sm font-medium">
                {index + 1}. {answer.content}
              </summary>
              <div className="px-4 pb-3 text-sm">
                제출 답안: {answer.userAnswer || "미응답"}
              </div>
              <div className="px-4 pb-3">
                <ConfusionToggle
                  source="AI"
                  questionId={String(answer.questionId)}
                />
              </div>
              <ReviewExplanation
                correct={answer.isCorrect}
                correctAnswer={answer.correctAnswer}
                explanation={answer.explanation}
              />
            </details>
          ))}
        </section>
        <Link
          href="/learning/history"
          className="block text-center text-sm text-muted-foreground"
        >
          전체 학습 기록
        </Link>
      </main>
    </div>
  );
}
