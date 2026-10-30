"use client";
import Link from "next/link";
import { PracticeHeader } from "@/components/molecules/PracticeHeader";
import { useWeaknessQuery } from "@/hooks/queries/useWeaknessQuery";
import {
  weaknessHref,
  koreanStudyDate,
  WEAKNESS_SOURCE_LABELS,
  type WeaknessFilters,
} from "@/lib/learning/weakness";
import { WeaknessNotice, WeaknessReadError } from "./WeaknessParts";
export default function MasteredQuestions({
  filters,
}: {
  filters: WeaknessFilters;
}) {
  const query = useWeaknessQuery();
  const questions =
    query.data?.questions.filter(
      (q) => q.status === "MASTERED" && filters.sources.includes(q.source),
    ) ?? [];
  return (
    <div className="mx-auto min-h-dvh max-w-app bg-white">
      <PracticeHeader title="극복한 문제" backHref={weaknessHref(filters)} />
      <main className="space-y-6 px-6 pb-8 pt-5">
        <h1 className="text-headline-medium">
          극복한 문제 {query.data ? questions.length : "–"}개
        </h1>
        <WeaknessNotice title="서로 다른 날에 두 번 연속 맞혔어요">
          극복한 문제는 약점공략에서 제외돼요. 다시 틀리거나 헷갈리면 약점으로
          돌아와요.
        </WeaknessNotice>
        {query.isError && (
          <WeaknessReadError onRetry={() => void query.refetch()} />
        )}
        {query.isPending && <p role="status">학습 기록을 불러오는 중이에요.</p>}
        {query.data && !questions.length && (
          <p className="text-body-medium text-muted-foreground">
            아직 극복한 문제가 없어요.
          </p>
        )}
        <ul className="divide-y divide-border">
          {questions.map((q) => (
            <li key={q.id} className="py-4">
              <p className="text-title-large">
                {q.subject}
                {q.topic ? ` · ${q.topic}` : ""}
              </p>
              <p className="mt-1 text-body-small text-muted-foreground">
                {WEAKNESS_SOURCE_LABELS[q.source]} ·{" "}
                {
                  query.data?.collections.find(
                    (c) => c.collectionRef === q.collectionRef,
                  )?.title
                }{" "}
                · 2회 연속 정답
                {q.masteredAt &&
                  ` · 극복한 날 ${koreanStudyDate(q.masteredAt)}`}
              </p>
            </li>
          ))}
        </ul>
        <Link
          className="block text-body-medium text-primary underline"
          href="/learning/history"
        >
          전체 학습 기록 보기
        </Link>
      </main>
    </div>
  );
}
