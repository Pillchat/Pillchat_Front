"use client";
import { useState } from "react";
import Link from "next/link";
import {
  ChevronRight,
  CircleHelp,
  SlidersHorizontal,
  RotateCcw,
} from "lucide-react";
import { PracticeHeader } from "@/components/molecules/PracticeHeader";
import { Button } from "@/components/ui/button";
import { useRouter } from "@/lib/navigation";
import { useWeaknessQuery } from "@/hooks/queries/useWeaknessQuery";
import {
  WEAKNESS_SOURCE_LABELS,
  WEAKNESS_RANGES,
  weaknessHref,
  weaknessQuestions,
  weaknessCount,
  type WeaknessFilters,
} from "@/lib/learning/weakness";
import {
  WeaknessCount,
  WeaknessNotice,
  WeaknessReadError,
} from "./WeaknessParts";

export default function WeaknessMain({
  filters,
}: {
  filters: WeaknessFilters;
}) {
  const router = useRouter();
  const query = useWeaknessQuery();
  const [tab, setTab] = useState<"all" | "subjects">("all");
  const [subject, setSubject] = useState<string | null>(null);
  const questions = weaknessQuestions(query.data, filters);
  const count = weaknessCount(query.data, filters);
  const subjects = [...new Set(questions.map((question) => question.subject))];
  const collections =
    query.data?.collections.filter((collection) =>
      questions.some(
        (question) =>
          question.collectionRef === collection.collectionRef &&
          (!subject || question.subject === subject),
      ),
    ) ?? [];
  const practiceHref = (source = questions[0]?.source ?? filters.sources[0]) =>
    `/learning/review?mode=wrong&category=${source ?? "HANDCRAFTED"}`;

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-app flex-col bg-white">
      <PracticeHeader
        title="약점공략"
        backHref="/"
        rightSlot={
          <Link
            href={weaknessHref(filters, "classification")}
            aria-label="학습 분류 기준 보기"
            className="rounded-lg p-2 text-muted-foreground"
          >
            <CircleHelp className="h-5 w-5" strokeWidth={1.5} />
          </Link>
        }
      />
      <main className="space-y-6 px-6 pb-8 pt-5">
        <h1 className="sr-only">약점공략</h1>
        <WeaknessCount
          label="다시 풀 문제 수"
          count={count}
          pending={query.isLoading}
        />
        <WeaknessNotice title="약점공략에는 약점만 모여요">
          복습할 문제를 골라 부족한 부분을 차근차근 채워보세요.
        </WeaknessNotice>
        {query.isError && (
          <WeaknessReadError onRetry={() => void query.refetch()} />
        )}
        <section aria-label="나의 약점 분야" className="space-y-4">
          <Link
            href={weaknessHref(filters, "areas")}
            className="flex items-center justify-between gap-3 rounded-xl border border-border p-4 focus-visible:outline-primary"
          >
            <SlidersHorizontal
              aria-hidden="true"
              className="h-6 w-6 shrink-0 text-primary"
              strokeWidth={1.5}
            />
            <span className="min-w-0 flex-1">
              <span className="block text-title-large">나의 약점 분야</span>
              <span className="mt-1 block text-body-small text-muted-foreground">
                {WEAKNESS_RANGES[filters.range]} ·{" "}
                {filters.sources
                  .map((source) => WEAKNESS_SOURCE_LABELS[source])
                  .join(" · ") || "출처 미선택"}
              </span>
            </span>
            <ChevronRight
              aria-hidden="true"
              className="h-5 w-5 shrink-0 text-muted-foreground"
            />
          </Link>
          <Button
            className="w-full"
            disabled={query.isLoading || !questions.length}
            onClick={() => router.push(practiceHref())}
          >
            약점 문제 풀기
          </Button>
          <p className="text-center text-body-small text-muted-foreground">
            문제 모음을 선택해 오답을 다시 풀 수 있어요.
          </p>
        </section>
        <section aria-labelledby="weakness-practice-title">
          <h2 id="weakness-practice-title" className="text-headline-small">
            관련 문제풀이 바로가기
          </h2>
          <div
            role="tablist"
            aria-label="문제풀이 목록"
            className="mt-4 flex border-b border-border"
          >
            {(
              [
                ["all", "전체"],
                ["subjects", "과목별"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                id={`weakness-tab-${value}`}
                type="button"
                role="tab"
                aria-selected={tab === value}
                aria-controls="weakness-practice-panel"
                onClick={() => {
                  setTab(value);
                  setSubject(null);
                }}
                className={`flex-1 border-b-2 py-3 text-title-small ${tab === value ? "border-primary text-primary" : "border-transparent text-muted-foreground"}`}
              >
                {label}
              </button>
            ))}
          </div>
          <div
            id="weakness-practice-panel"
            role="tabpanel"
            aria-labelledby={`weakness-tab-${tab}`}
            aria-busy={query.isLoading}
          >
            {query.isLoading && (
              <p className="py-8 text-center text-body-medium text-muted-foreground">
                학습 기록을 불러오는 중이에요.
              </p>
            )}
            {!query.isLoading && !query.isError && !questions.length && (
              <div className="py-8 text-center">
                <RotateCcw
                  aria-hidden="true"
                  className="mx-auto mb-3 h-8 w-8 text-gray-300"
                />
                <p className="text-body-medium text-muted-foreground">
                  선택한 출처에 다시 풀 오답이 없어요.
                </p>
              </div>
            )}
            {tab === "subjects" && !subject ? (
              subjects.map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => setSubject(name)}
                  className="flex w-full items-center justify-between gap-3 border-b border-border py-4 text-left"
                >
                  <span className="min-w-0 flex-1 text-title-large">
                    {name}
                  </span>
                  <span className="text-body-medium text-muted-foreground">
                    {
                      questions.filter((question) => question.subject === name)
                        .length
                    }
                    문제
                  </span>
                  <ChevronRight
                    aria-hidden="true"
                    className="h-5 w-5 shrink-0 text-muted-foreground"
                  />
                </button>
              ))
            ) : (
              <>
                {subject && (
                  <button
                    type="button"
                    className="mt-4 text-body-medium text-primary underline"
                    onClick={() => setSubject(null)}
                  >
                    전체 과목 보기
                  </button>
                )}
                {collections.map((collection) => (
                  <button
                    key={collection.collectionRef}
                    type="button"
                    onClick={() => router.push(practiceHref(collection.source))}
                    className="flex w-full items-center justify-between gap-3 border-b border-border py-4 text-left"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block break-words text-title-large">
                        {collection.title}
                      </span>
                      <span className="mt-1 block text-body-small text-muted-foreground">
                        {WEAKNESS_SOURCE_LABELS[collection.source]} ·{" "}
                        {
                          questions.filter(
                            (question) =>
                              question.collectionRef ===
                                collection.collectionRef &&
                              (!subject || question.subject === subject),
                          ).length
                        }
                        문제
                      </span>
                    </span>
                    <ChevronRight
                      aria-hidden="true"
                      className="h-5 w-5 shrink-0 text-muted-foreground"
                    />
                  </button>
                ))}
              </>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
