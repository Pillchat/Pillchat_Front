"use client";
import { useRef, useState } from "react";
import { ApiError } from "@/lib/client/fetch";
import Link from "next/link";
import QuestionBankIcon from "@/public/icons/question-bank.svg";
import SettingsIcon from "@/public/icons/settings.svg";
import { ChevronDown, ChevronRight, CircleHelp, RotateCcw } from "lucide-react";
import { AppShell } from "@/components/molecules/AppShell";
import { PracticeHeader } from "@/components/molecules/PracticeHeader";
import { Button } from "@/components/ui/button";
import { PercentageBar } from "@/components/atoms/PercentageBar";
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
  scheduledWeaknessQuestions,
  weaknessReviewDay,
  weaknessFields,
  recentlyMastered,
  koreanStudyDate,
  type WeaknessFilters,
  type WeaknessStart,
  type WeaknessCollection,
} from "@/lib/learning/weakness";
import { WeaknessReadError } from "./WeaknessParts";

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
  const scheduled = scheduledWeaknessQuestions(query.data, filters);
  const practiceQuestions = questions.filter(
    (q) => !subject || q.subject === subject,
  );
  const count = query.data ? practiceQuestions.length : null;
  const fields = weaknessFields(query.data, filters);
  const subjects = [...new Set(scheduled.map((q) => q.subject))];
  const visible = scheduled.filter((q) => !subject || q.subject === subject);
  const collections = [...new Set(visible.map((q) => q.collectionRef))].flatMap(
    (reference) =>
      query.data?.collections.filter((c) => c.collectionRef === reference) ??
      [],
  );
  const sources = filters.sources.filter((source) =>
    practiceQuestions.some((q) => q.source === source),
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
    if (
      pending ||
      !practiceQuestions.some(
        (q) =>
          q.source === source &&
          (!collectionRef || q.collectionRef === collectionRef),
      )
    )
      return;
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
  const mastered = query.data
    ? query.data.questions.filter(
        (q) => q.status === "MASTERED" && filters.sources.includes(q.source),
      ).length
    : null;
  const featured = collections.find((collection) =>
    practiceQuestions.some((q) => q.collectionRef === collection.collectionRef),
  );
  const remaining = collections.filter((collection) => collection !== featured);
  const renderCollection = (collection: WeaknessCollection) => {
    const items = visible.filter(
      (q) => q.collectionRef === collection.collectionRef,
    );
    const available = practiceQuestions.filter(
      (q) => q.collectionRef === collection.collectionRef,
    );
    const dueDate = items.reduce<string | null>(
      (earliest, q) =>
        q.dueDate && (!earliest || q.dueDate < earliest) ? q.dueDate : earliest,
      null,
    );
    const reviewDay = weaknessReviewDay(dueDate, query.data?.serverDate);
    const canPractice = available.length > 0;
    return (
      <div
        key={collection.collectionRef}
        className="relative rounded-xl border border-gray-200 p-3"
      >
        <button
          key={collection.collectionRef}
          type="button"
          disabled={pending || !canPractice}
          onClick={() => launch(collection.source, collection.collectionRef)}
          className={`flex min-h-12 w-full items-center gap-3 rounded-lg pr-14 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-default ${pending ? "opacity-50" : ""}`}
        >
          <QuestionBankIcon
            aria-hidden="true"
            viewBox="0 0 32 32"
            className="h-8 w-8 shrink-0 text-primary"
          />
          <span className="min-w-0 flex-1">
            <span className="block break-words text-title-large">
              {collection.title}
            </span>
            <span className="mt-1 flex flex-wrap gap-x-2 gap-y-1 text-body-small text-muted-foreground">
              {reviewDay && <span>복습 예정 {reviewDay}</span>}
              <span>{WEAKNESS_SOURCE_LABELS[collection.source]}</span>
              <span>{canPractice ? available.length : items.length}문제</span>
            </span>
            <span
              className={
                canPractice
                  ? "sr-only"
                  : "mt-1 block text-body-small text-muted-foreground"
              }
            >
              {canPractice ? "복습하기" : "내일 복습"}
            </span>
          </span>
        </button>
        <details className="group">
          <summary className="absolute right-2 top-4 flex min-h-11 w-12 cursor-pointer list-none flex-col items-center justify-center gap-1 rounded-lg text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary [&::-webkit-details-marker]:hidden">
            <span className="text-label-small">현황 보기</span>
            <span className="sr-only">
              문제별 복습 현황 · {items.length}문제 · 복습 일정과 연속 정답 보기
            </span>
            <ChevronDown
              aria-hidden="true"
              className="h-4 w-4 transition-transform group-open:rotate-180"
            />
          </summary>
          <ul className="mt-3 space-y-4 border-t border-gray-100 pt-3">
            {items.map((q, index) => (
              <li key={q.id} className="space-y-2">
                <p className="text-title-small">
                  {index + 1}. {q.subject}
                  {q.topic ? ` · ${q.topic}` : ""}
                </p>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-body-small">
                  <span>
                    다음 복습{" "}
                    {weaknessReviewDay(q.dueDate, query.data?.serverDate) ??
                      q.dueDate ??
                      "–"}
                  </span>
                  <span>
                    연속 정답{" "}
                    <strong className="tabular-nums">
                      {q.consecutiveCorrect}/2회
                    </strong>
                  </span>
                </div>
                <p className="text-body-small text-muted-foreground">
                  최근 오답 {koreanStudyDate(q.lastWrongAt) ?? "없음"}
                </p>
              </li>
            ))}
          </ul>
        </details>
      </div>
    );
  };
  return (
    <AppShell className="flex flex-col" bottomSpacing="cta">
      <PracticeHeader title="약점공략" backHref="/" separator={false} />
      <h1 className="sr-only">약점공략</h1>
      <main className="space-y-4 px-6 pb-6 pt-4">
        <section aria-label="오늘 복습할 문제" aria-busy={query.isPending}>
          <h2 className="text-headline-small">오늘 복습할 문제</h2>
          <p
            id="weakness-today-count"
            aria-live="polite"
            className="mt-3 text-3xl font-bold tabular-nums"
          >
            {count ?? "–"}
            <span className="ml-1 text-title-large">문제</span>
          </p>
        </section>
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
        {query.isPending && (
          <p role="status" className="text-body-medium text-muted-foreground">
            학습 기록을 불러오는 중이에요.
          </p>
        )}
        {featured && renderCollection(featured)}
        <section aria-label="나의 약점 분야" className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-headline-small">나의 약점 분야</h2>
            <Link
              href={weaknessHref(filters, "areas")}
              aria-label="나의 약점 분야 설정"
              className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-lg text-body-small focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <SettingsIcon
                aria-hidden="true"
                viewBox="0 0 32 32"
                className="h-5 w-5 shrink-0"
              />
              필터 설정
            </Link>
          </div>
          <p className="text-body-medium text-muted-foreground">
            틀린 문제와 풀이 중 ‘헷갈려요’를 직접 표시한 문제를 복습해요. 서로
            다른 날 2회 연속 정답이면 극복해요.
          </p>
          {fields.length ? (
            <ol
              className="grid grid-cols-3 gap-3"
              aria-label="오답률 상위 3개 분야"
            >
              {fields.slice(0, 3).map((field) => (
                <li key={field.subject} className="min-w-0">
                  <p className="break-words text-title-small">
                    {field.subject}
                  </p>
                  <strong className="mt-2 block text-xl tabular-nums">
                    {Math.round(field.wrongRate * 10) / 10}%
                  </strong>
                  <PercentageBar
                    value={field.wrongRate}
                    label={`${field.subject} 오답·‘헷갈려요’ 표시 비율`}
                    className="mt-2"
                  />
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-body-medium text-muted-foreground">
              {query.isPending
                ? "약점 분야를 불러오는 중이에요."
                : query.data
                  ? "현재 약점으로 남아 있는 분야가 없어요."
                  : "약점 분야를 불러오지 못했어요."}
            </p>
          )}
          <p className="text-body-small text-muted-foreground">
            최근 30일 최초 풀이 기준 · 오답·‘헷갈려요’ 표시 비율
          </p>
          <Link
            href={weaknessHref(filters, "mastered")}
            className="flex min-h-11 items-center justify-between gap-3 rounded-lg text-body-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <span>
              지난 7일 극복한 문제{" "}
              <strong className="text-primary">
                {recentlyMastered(query.data, filters) ?? "–"}개
              </strong>
              <span className="sr-only">
                {" "}
                · 극복한 문제 {mastered ?? "–"}개 모두 보기
              </span>
            </span>
            <ChevronRight
              aria-hidden="true"
              className="h-4 w-4 shrink-0 text-muted-foreground"
            />
          </Link>
        </section>
        <section
          aria-labelledby="weakness-practice-title"
          aria-label="문제 모음별 복습"
          className="relative space-y-3"
        >
          <div className="flex items-center justify-between gap-3">
            <h2
              id="weakness-practice-title"
              className="min-w-0 max-w-[calc(100%-9rem)] text-title-large"
            >
              {tab === "all" &&
              remaining.length > 0 &&
              remaining.every(
                (c) =>
                  !practiceQuestions.some(
                    (q) => q.collectionRef === c.collectionRef,
                  ),
              )
                ? "내일 복습 예정"
                : "문제 모음별 복습"}
            </h2>
            <Link
              href={weaknessHref(filters, "classification")}
              aria-label="학습 분류 기준 보기"
              className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center gap-1 text-body-small text-muted-foreground"
            >
              <CircleHelp aria-hidden="true" className="h-4 w-4" />
              <span className="hidden min-[375px]:inline">분류 기준</span>
            </Link>
          </div>
          <details className="group/options !mt-0">
            <summary className="absolute right-14 top-0 flex min-h-11 cursor-pointer list-none items-center gap-1 rounded-lg text-body-small text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary min-[375px]:right-20 [&::-webkit-details-marker]:hidden">
              목록 옵션
              <ChevronDown
                aria-hidden="true"
                className="h-3 w-3 transition-transform group-open/options:rotate-180"
              />
            </summary>
            <div className="space-y-2 rounded-xl border border-gray-200 p-3">
              <div
                role="group"
                aria-label="문제풀이 목록 보기"
                className="flex gap-6"
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
                    className={`min-h-11 text-title-small underline-offset-8 ${tab === value ? "text-primary underline decoration-2" : "text-muted-foreground"}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <p className="text-body-small text-muted-foreground">
                {WEAKNESS_SORTS[filters.sort]} · 오늘 푼 문제는 내일부터 다시
                보여요.
              </p>
            </div>
          </details>
          {subject && (
            <button
              type="button"
              className="min-h-11 text-body-medium text-primary underline"
              onClick={() => setSubject(null)}
            >
              {subject} · 전체 과목 보기
            </button>
          )}
          <div aria-busy={query.isPending} className="space-y-3">
            {!query.isPending && !query.isError && !scheduled.length && (
              <div className="py-4 text-center">
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
                  className="flex min-h-14 w-full items-center justify-between gap-3 rounded-xl border border-gray-200 p-3 text-left"
                >
                  <span className="min-w-0 text-title-large">{name}</span>
                  <span className="shrink-0 text-body-small text-muted-foreground">
                    {scheduled.filter((q) => q.subject === name).length}문제
                  </span>
                  <ChevronRight
                    aria-hidden="true"
                    className="h-4 w-4 shrink-0"
                  />
                </button>
              ))
            ) : (
              <>
                {remaining.length > 0 &&
                  remaining.every(
                    (c) =>
                      !practiceQuestions.some(
                        (q) => q.collectionRef === c.collectionRef,
                      ),
                  ) && <span className="sr-only">내일 복습 예정</span>}
                {remaining.map(renderCollection)}
                {!remaining.length && featured && (
                  <p className="text-body-small text-muted-foreground">
                    오늘 복습할 문제 모음은 위에서 바로 시작할 수 있어요.
                  </p>
                )}
              </>
            )}
          </div>
        </section>
      </main>
      <footer className="fixed bottom-[var(--bottom-nav-height)] left-1/2 z-40 w-full max-w-app -translate-x-1/2 bg-white px-6 py-3">
        <Button
          aria-label="복습 시작"
          aria-describedby="weakness-today-count"
          className="h-12 w-full text-white"
          disabled={query.isPending || !practiceQuestions.length || pending}
          onClick={() =>
            sources.length === 1 ? launch(sources[0]) : setChooseSource(true)
          }
        >
          {count ?? "–"}문제 복습 시작
        </Button>
      </footer>
      <Dialog open={chooseSource} onOpenChange={setChooseSource}>
        <DialogContent>
          <DialogTitle>복습할 문제 출처</DialogTitle>
          <DialogDescription>
            선택한 범위와 정렬 순서로 출처별 약점공략을 시작해요.
          </DialogDescription>
          {sources.map((source) => (
            <Button
              key={source}
              variant="ghost"
              disabled={pending}
              onClick={() => launch(source)}
            >
              {WEAKNESS_SOURCE_LABELS[source]} ·{" "}
              {practiceQuestions.filter((q) => q.source === source).length}문제
            </Button>
          ))}
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
