"use client";
import { useRef, useState } from "react";
import { ApiError } from "@/lib/client/fetch";
import Link from "next/link";
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
  return (
    <AppShell className="flex flex-col">
      <PracticeHeader title="약점공략" backHref="/" separator={false} />
      <main className="space-y-6 px-6 pb-8 pt-5">
        <h1 className="sr-only">약점공략</h1>
        <WeaknessCount
          label="오늘 복습할"
          count={count}
          pending={query.isPending}
        >
          <Button
            className="shrink-0"
            disabled={query.isPending || !practiceQuestions.length || pending}
            onClick={() =>
              sources.length === 1 ? launch(sources[0]) : setChooseSource(true)
            }
          >
            복습 시작
          </Button>
        </WeaknessCount>
        <WeaknessNotice title="약점공략에는 약점만 모여요">
          틀린 문제와 풀이 중 ‘헷갈려요’를 직접 표시한 문제를 복습해요. 서로
          다른 날에 2회 연속 정답이면 극복한 문제로 옮겨져요.
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
        <section
          aria-label="나의 약점 분야"
          className="space-y-4 rounded-2xl bg-gray-50 p-4"
        >
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-headline-small">나의 약점 분야</h2>
            <Link
              href={weaknessHref(filters, "areas")}
              aria-label="나의 약점 분야 설정"
              className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl bg-white px-3 text-body-small text-foreground"
            >
              <SettingsIcon
                aria-hidden="true"
                viewBox="0 0 32 32"
                className="h-5 w-5 shrink-0"
              />
              필터 설정
            </Link>
          </div>
          <p className="text-body-small text-muted-foreground">
            최근 30일 최초 풀이 기준 · 오답·‘헷갈려요’ 표시 비율
          </p>
          <div className="min-w-0" aria-busy={query.isPending}>
            {fields.length > 0 ? (
              <ol className="space-y-3" aria-label="오답률 상위 3개 분야">
                {fields.slice(0, 3).map((field) => (
                  <li key={field.subject}>
                    <div className="flex items-start justify-between gap-3 text-body-medium">
                      <span className="min-w-0 break-words">
                        {field.subject}
                      </span>
                      <strong className="shrink-0 tabular-nums text-primary">
                        {Math.round(field.wrongRate * 10) / 10}%
                      </strong>
                    </div>
                    <PercentageBar
                      value={field.wrongRate}
                      label={`${field.subject} 오답·‘헷갈려요’ 표시 비율`}
                      className="mt-1.5"
                    />
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
          <Link
            href={weaknessHref(filters, "mastered")}
            className="flex items-center justify-between gap-3 rounded-xl bg-white p-4"
          >
            <span>
              <span className="block text-body-medium">
                지난 7일 극복한 문제{" "}
                <strong className="text-primary">
                  {recentlyMastered(query.data, filters) ?? "–"}개
                </strong>
              </span>
              <span className="mt-1 block text-body-small text-muted-foreground">
                극복한 문제 {mastered ?? "–"}개 모두 보기
              </span>
            </span>
            <ChevronRight
              aria-hidden="true"
              className="h-5 w-5 shrink-0 text-muted-foreground"
            />
          </Link>
          <p className="text-body-small text-muted-foreground">
            오늘 푼 문제는 다음 날부터 다시 복습할 수 있어요.
          </p>
        </section>
        <section aria-labelledby="weakness-practice-title">
          <div className="flex items-center justify-between gap-2">
            <h2 id="weakness-practice-title" className="text-headline-small">
              문제 모음별 복습
            </h2>
            <Link
              href={weaknessHref(filters, "classification")}
              aria-label="학습 분류 기준 보기"
              className="inline-flex min-h-11 shrink-0 items-center gap-1 rounded-xl bg-gray-50 px-3 text-body-small text-muted-foreground"
            >
              <CircleHelp
                aria-hidden="true"
                className="h-4 w-4"
                strokeWidth={2}
              />
              분류 기준
            </Link>
          </div>
          <p className="mt-2 text-body-small text-muted-foreground">
            문제 모음을 골라 해당 모음의 약점을 복습해요.
            <span className="mt-1 block">{WEAKNESS_SORTS[filters.sort]}</span>
          </p>
          <div
            role="group"
            aria-label="문제풀이 목록 보기"
            className="mt-4 flex gap-1 rounded-xl bg-gray-50 p-1"
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
                className={`flex-1 rounded-lg py-3 text-title-small ${tab === value ? "bg-white text-primary" : "text-muted-foreground"}`}
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
            {!query.isPending && !query.isError && !scheduled.length && (
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
                  className="mt-3 flex w-full items-center justify-between gap-3 rounded-xl bg-gray-50 p-4 text-left"
                >
                  <span className="min-w-0 flex-1 text-title-large">
                    {name}
                  </span>
                  <span className="shrink-0 text-body-medium text-muted-foreground">
                    {scheduled.filter((q) => q.subject === name).length}문제
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
                {collections.map((collection) => {
                  const items = visible.filter(
                    (q) => q.collectionRef === collection.collectionRef,
                  );
                  const available = practiceQuestions.filter(
                    (q) => q.collectionRef === collection.collectionRef,
                  );
                  const dueDate = items.reduce<string | null>(
                    (earliest, q) =>
                      q.dueDate && (!earliest || q.dueDate < earliest)
                        ? q.dueDate
                        : earliest,
                    null,
                  );
                  const reviewDay = weaknessReviewDay(
                    dueDate,
                    query.data?.serverDate,
                  );
                  const canPractice = available.length > 0;
                  return (
                    <div
                      key={collection.collectionRef}
                      className="mt-3 rounded-xl bg-gray-50 p-4"
                    >
                      <button
                        key={collection.collectionRef}
                        type="button"
                        disabled={pending || !canPractice}
                        onClick={() =>
                          launch(collection.source, collection.collectionRef)
                        }
                        className={`flex w-full items-center justify-between gap-3 pb-4 text-left disabled:cursor-default ${pending ? "opacity-50" : ""}`}
                      >
                        <span className="min-w-0 flex-1">
                          <span
                            className={`block break-words text-title-large ${canPractice ? "text-foreground" : "text-muted-foreground"}`}
                          >
                            {collection.title}
                          </span>
                          <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-body-small text-muted-foreground">
                            {reviewDay && (
                              <>
                                <span className="whitespace-nowrap">
                                  복습 예정 {reviewDay}
                                </span>
                                <span aria-hidden="true">·</span>
                              </>
                            )}
                            <span className="whitespace-nowrap">
                              {WEAKNESS_SOURCE_LABELS[collection.source]}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span className="whitespace-nowrap">
                              {canPractice ? available.length : items.length}
                              문제
                            </span>
                          </span>
                        </span>
                        <ChevronRight
                          aria-hidden="true"
                          className="h-5 w-5 shrink-0 text-muted-foreground"
                        />
                      </button>
                      <details className="group text-body-small text-muted-foreground">
                        <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 rounded-xl bg-white px-3 py-3 [&::-webkit-details-marker]:hidden">
                          <span>
                            <span className="block text-title-small text-foreground">
                              문제별 복습 현황
                            </span>
                            <span className="mt-1 block">
                              {items.length}문제 · 복습 일정과 연속 정답 보기
                            </span>
                          </span>
                          <ChevronDown
                            aria-hidden="true"
                            className="h-5 w-5 shrink-0 transition-transform group-open:rotate-180"
                          />
                        </summary>
                        <ul className="mt-3 space-y-3">
                          {items.map((q) => (
                            <li key={q.id} className="rounded-xl bg-white p-3">
                              <p>
                                {q.subject}
                                {q.topic ? ` · ${q.topic}` : ""} ·{" "}
                                {WEAKNESS_SOURCE_LABELS[q.source]}
                              </p>
                              <p className="mt-1">
                                최근 오답{" "}
                                {koreanStudyDate(q.lastWrongAt) ?? "없음"} ·
                                연속 정답 {q.consecutiveCorrect}/2회
                              </p>
                              <p className="mt-1">
                                다음 복습 {q.dueDate ?? "–"}
                              </p>
                            </li>
                          ))}
                        </ul>
                      </details>
                    </div>
                  );
                })}
              </>
            )}
          </div>
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
              variant="ghost"
              className="bg-gray-50"
              disabled={pending}
              onClick={() => launch(source)}
            >
              {WEAKNESS_SOURCE_LABELS[source]} ·{" "}
              {practiceQuestions.filter((q) => q.source === source).length}
              문제
            </Button>
          ))}
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
