"use client";
import { useRef, useState } from "react";
import { ApiError } from "@/lib/client/fetch";
import Link from "next/link";
import {
  ChevronRight,
  CircleHelp,
  SlidersHorizontal,
  RotateCcw,
} from "lucide-react";
import { PracticeHeader } from "@/components/molecules/PracticeHeader";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useRouter } from "@/lib/navigation";
import { useWeaknessQuery } from "@/hooks/queries/useWeaknessQuery";
import { useStartWeaknessMutation } from "@/hooks/mutations/useStartWeaknessMutation";
import { reviewAttemptHref } from "@/lib/learning/review";
import type { ReviewSource } from "@/types/review";
import {
  WEAKNESS_SOURCE_LABELS,
  WEAKNESS_SORTS,
  weaknessHref,
  weaknessQuestions,
  weaknessCount,
  weaknessFields,
  type WeaknessFilters,
  type WeaknessStart,
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
  const start = useStartWeaknessMutation();
  const startLock = useRef(false);
  const [tab, setTab] = useState<"all" | "subjects">("all");
  const [subject, setSubject] = useState<string | null>(null);
  const [chooseSource, setChooseSource] = useState(false);
  const questions = weaknessQuestions(query.data, filters);
  const count = weaknessCount(query.data, filters);
  const fields = weaknessFields(query.data, filters);
  const subjects = [...new Set(questions.map((q) => q.subject))];
  const visible = questions.filter((q) => !subject || q.subject === subject);
  const collections = [...new Set(visible.map((q) => q.collectionRef))].flatMap(
    (reference) =>
      query.data?.collections.filter((c) => c.collectionRef === reference) ??
      [],
  );
  const sources = filters.sources.filter((source) =>
    questions.some((q) => q.source === source),
  );
  const uncertain =
    start.isError &&
    (!(start.error instanceof ApiError) ||
      start.error.status >= 500 ||
      start.error.status === 408);
  const pending = start.isPending || start.isSuccess || uncertain;
  const run = (request: WeaknessStart) => {
    if (startLock.current) return;
    startLock.current = true;
    start.mutate(request, {
      onSuccess: (response) => router.push(reviewAttemptHref(response)),
      onError: () => {
        startLock.current = false;
      },
    });
  };
  const launch = (source: ReviewSource, collectionRef?: string) => {
    if (pending) return;
    setChooseSource(false);
    run({
      source,
      collectionRef,
      range: filters.range,
      sort: filters.sort,
      ...(subject ? { subject } : {}),
      idempotencyKey: crypto.randomUUID(),
    });
  };
  const mastered =
    query.data?.questions.filter(
      (q) => q.status === "MASTERED" && filters.sources.includes(q.source),
    ).length ?? 0;
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-app flex-col bg-white">
      <PracticeHeader title="약점공략" backHref="/" />
      <main className="space-y-6 px-6 pb-8 pt-5">
        <h1 className="sr-only">약점공략</h1>
        <WeaknessCount
          label="다시 풀 문제 수"
          count={count}
          pending={query.isPending}
        />
        <WeaknessNotice title="약점공략에는 약점만 모여요">
          오답·헷갈린 문제를 복습해요. 2회 연속 정답이면 극복한 문제로 옮겨져요.
        </WeaknessNotice>
        {query.isError && (
          <WeaknessReadError onRetry={() => void query.refetch()} />
        )}
        {start.isError && (
          <p role="alert" className="text-body-medium text-destructive">
            {uncertain ? "복습 시작을 확인하지 못했어요." : start.error.message}{" "}
            <button
              type="button"
              className="underline"
              disabled={start.isPending}
              onClick={() =>
                uncertain && start.variables
                  ? run(start.variables)
                  : (start.reset(), void query.refetch())
              }
            >
              {uncertain ? "다시 시도" : "목록 새로고침"}
            </button>
          </p>
        )}
        <section aria-label="나의 약점 분야" className="space-y-4">
          <div className="flex items-center gap-4">
            <div
              className="flex min-h-32 min-w-0 flex-1 flex-col justify-center rounded-xl border border-border bg-white p-4"
              aria-busy={query.isPending}
            >
              {fields.length > 0 ? (
                <ol className="space-y-3" aria-label="오답률 상위 3개 분야">
                  {fields.slice(0, 3).map((field) => (
                    <li
                      key={field.subject}
                      className="flex items-start justify-between gap-3 text-body-medium"
                    >
                      <span className="min-w-0 break-words">
                        {field.subject}
                      </span>
                      <strong className="shrink-0 tabular-nums text-primary">
                        {Math.round(field.wrongRate * 10) / 10}%
                      </strong>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-body-small text-muted-foreground">
                  {query.isPending
                    ? "약점 분야를 불러오는 중이에요."
                    : query.data
                      ? "현재 약점으로 남아 있는 분야가 없어요."
                      : "약점 분야를 불러오지 못했어요."}
                </p>
              )}
            </div>
            <Button
              asChild
              variant="outline"
              size="icon"
              className="h-[3.625rem] w-[3.625rem] shrink-0 border-border text-primary"
            >
              <Link
                href={weaknessHref(filters, "areas")}
                aria-label="나의 약점 분야 설정"
                title="나의 약점 분야 설정"
              >
                <SlidersHorizontal aria-hidden="true" strokeWidth={1.5} />
              </Link>
            </Button>
          </div>
          <Button
            className="w-full"
            disabled={query.isPending || !questions.length || pending}
            onClick={() =>
              sources.length === 1 ? launch(sources[0]) : setChooseSource(true)
            }
          >
            약점 문제 풀기
          </Button>
          <p className="text-center text-body-small text-muted-foreground">
            오늘 푼 문제는 다음 날부터 다시 복습할 수 있어요.
          </p>
        </section>
        <section aria-labelledby="weakness-practice-title">
          <div className="flex items-center justify-between gap-2">
            <h2 id="weakness-practice-title" className="text-headline-small">
              관련 문제풀이 바로가기
            </h2>
            <Link
              href={weaknessHref(filters, "classification")}
              aria-label="학습 분류 기준 보기"
              className="shrink-0 rounded-lg p-2 text-muted-foreground"
            >
              <CircleHelp className="h-5 w-5" strokeWidth={1.5} />
            </Link>
          </div>
          <p className="mt-2 text-body-small text-muted-foreground">
            {WEAKNESS_SORTS[filters.sort]}
          </p>
          <div
            role="group"
            aria-label="문제풀이 목록 보기"
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
                aria-pressed={tab === value}
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
          <div aria-busy={query.isPending}>
            {query.isPending && (
              <p className="py-8 text-center text-body-medium text-muted-foreground">
                학습 기록을 불러오는 중이에요.
              </p>
            )}
            {!query.isPending && !query.isError && !questions.length && (
              <div className="py-8 text-center">
                <RotateCcw
                  aria-hidden="true"
                  className="mx-auto mb-3 h-8 w-8 text-gray-300"
                />
                <p className="text-body-medium text-muted-foreground">
                  오늘 다시 풀 약점 문제가 없어요.
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
                  <span className="shrink-0 text-body-medium text-muted-foreground">
                    {questions.filter((q) => q.subject === name).length}문제
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
                    disabled={pending}
                    onClick={() =>
                      launch(collection.source, collection.collectionRef)
                    }
                    className="flex w-full items-center justify-between gap-3 border-b border-border py-4 text-left disabled:opacity-50"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block break-words text-title-large">
                        {collection.title}
                      </span>
                      <span className="mt-1 block text-body-small text-muted-foreground">
                        {WEAKNESS_SOURCE_LABELS[collection.source]} ·{" "}
                        {
                          visible.filter(
                            (q) => q.collectionRef === collection.collectionRef,
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
          <Link
            href={weaknessHref(filters, "mastered")}
            className="mt-5 flex items-center justify-between rounded-xl bg-gray-50 p-4 text-title-small"
          >
            극복한 문제 {mastered}개 보기
            <ChevronRight aria-hidden="true" className="h-5 w-5" />
          </Link>
        </section>
      </main>
      <Dialog open={chooseSource} onOpenChange={setChooseSource}>
        <DialogContent>
          <DialogTitle>복습할 문제 출처</DialogTitle>
          <DialogDescription>
            선택한 범위와 정렬 순서로 출처별 약점공략을 시작해요.
          </DialogDescription>
          {sources.map((source) => (
            <Button
              key={source}
              variant="outline"
              disabled={pending}
              onClick={() => launch(source)}
            >
              {WEAKNESS_SOURCE_LABELS[source]} ·{" "}
              {questions.filter((q) => q.source === source).length}문제
            </Button>
          ))}
        </DialogContent>
      </Dialog>
    </div>
  );
}
