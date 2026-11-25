"use client";
import Link from "next/link";
import { PracticeHeader } from "@/components/molecules/PracticeHeader";
import { useWeaknessQuery } from "@/hooks/queries/useWeaknessQuery";
import { learningDisplayTitle } from "@/lib/learning/attemptLabels";
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
      <PracticeHeader
        title="극복한 문제"
        backHref={weaknessHref(filters)}
        separator={false}
      />
      <main className="space-y-6 px-6 pb-8 pt-5">
        <h1 className="text-headline-medium">
          극복한 문제 {query.data ? questions.length : "–"}개
        </h1>
        <WeaknessNotice title="예정된 복습을 마쳤어요">
          다시 틀리면 다음 날부터 복습해요. 북마크한 문항은 저장 목록에서 볼 수
          있어요.
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
        <ul className="space-y-3">
          {questions.map((q) => {
            const collectionTitle = query.data?.collections.find(
              (collection) => collection.collectionRef === q.collectionRef,
            )?.title;
            return (
              <li key={q.id} className="rounded-xl bg-gray-50 p-4">
                <p className="text-title-large">
                  {q.subject}
                  {q.topic ? ` · ${q.topic}` : ""}
                </p>
                <p className="mt-1 text-body-small text-muted-foreground">
                  {WEAKNESS_SOURCE_LABELS[q.source]}
                  {collectionTitle?.trim() &&
                    ` · ${learningDisplayTitle(q.source, collectionTitle)}`}
                  {q.masteredAt &&
                    ` · 극복한 날 ${koreanStudyDate(q.masteredAt)}`}
                </p>
              </li>
            );
          })}
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
