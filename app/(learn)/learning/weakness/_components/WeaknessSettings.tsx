"use client";
import { useState } from "react";
import { PracticeHeader } from "@/components/molecules/PracticeHeader";
import { Button } from "@/components/ui/button";
import { useRouter } from "@/lib/navigation";
import { useWeaknessQuery } from "@/hooks/queries/useWeaknessQuery";
import {
  WEAKNESS_RANGES,
  WEAKNESS_SORTS,
  WEAKNESS_SOURCES,
  WEAKNESS_SOURCE_LABELS,
  weaknessHref,
  weaknessCount,
  type WeaknessFilters,
} from "@/lib/learning/weakness";
import {
  WeaknessCount,
  WeaknessNotice,
  WeaknessReadError,
} from "./WeaknessParts";

export default function WeaknessSettings({
  initialFilters,
}: {
  initialFilters: WeaknessFilters;
}) {
  const [filters, setFilters] = useState(initialFilters);
  const router = useRouter();
  const query = useWeaknessQuery();
  const count = weaknessCount(query.data, filters);
  const choiceClass =
    "flex cursor-pointer items-center gap-3 rounded-xl border border-border px-4 py-3 text-body-medium has-[:checked]:border-primary has-[:checked]:bg-primary-980";
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-app flex-col bg-white">
      <PracticeHeader
        title="나의 약점 분야"
        backHref={weaknessHref(initialFilters)}
      />
      <main className="space-y-6 px-6 pb-36 pt-5">
        <h1 className="sr-only">나의 약점 분야</h1>
        <WeaknessCount
          label="복습할 문제 수"
          count={count}
          pending={query.isLoading}
        />
        <WeaknessNotice title="오답 • 헷갈림만 보여줘요">
          나에게 필요한 문제 범위와 출처를 골라보세요.
        </WeaknessNotice>
        {query.isError && (
          <WeaknessReadError onRetry={() => void query.refetch()} />
        )}
        <fieldset className="space-y-3">
          <legend className="mb-3 text-title-large">
            문제 범위{" "}
            <span className="text-body-small text-muted-foreground">
              하나만 선택
            </span>
          </legend>
          {(["today", "all", "wrong"] as const).map((value) => (
            <label key={value} className={choiceClass}>
              <input
                type="radio"
                name="weakness-range"
                value={value}
                checked={filters.range === value}
                onChange={() =>
                  setFilters((previous) => ({ ...previous, range: value }))
                }
                className="h-4 w-4 shrink-0 accent-primary"
              />
              {WEAKNESS_RANGES[value]}
            </label>
          ))}
        </fieldset>
        <fieldset className="space-y-3">
          <legend className="mb-3 text-title-large">
            문제 출처{" "}
            <span className="text-body-small text-muted-foreground">
              복수 선택
            </span>
          </legend>
          {WEAKNESS_SOURCES.map((source) => (
            <label key={source} className={choiceClass}>
              <input
                type="checkbox"
                value={source}
                checked={filters.sources.includes(source)}
                onChange={() =>
                  setFilters((previous) => ({
                    ...previous,
                    sources: previous.sources.includes(source)
                      ? previous.sources.filter((item) => item !== source)
                      : WEAKNESS_SOURCES.filter(
                          (item) =>
                            item === source || previous.sources.includes(item),
                        ),
                  }))
                }
                className="h-4 w-4 shrink-0 accent-primary"
              />
              {WEAKNESS_SOURCE_LABELS[source]}
            </label>
          ))}
        </fieldset>
        <fieldset className="space-y-3">
          <legend className="mb-3 text-title-large">
            정렬{" "}
            <span className="text-body-small text-muted-foreground">
              하나만 선택
            </span>
          </legend>
          {(Object.keys(WEAKNESS_SORTS) as (keyof typeof WEAKNESS_SORTS)[]).map(
            (value) => (
              <label key={value} className={choiceClass}>
                <input
                  type="radio"
                  name="weakness-sort"
                  value={value}
                  checked={filters.sort === value}
                  onChange={() =>
                    setFilters((previous) => ({ ...previous, sort: value }))
                  }
                  className="h-4 w-4 shrink-0 accent-primary"
                />
                {WEAKNESS_SORTS[value]}
              </label>
            ),
          )}
        </fieldset>
        <p className="text-body-small text-muted-foreground">
          복습 일정·헷갈림 상태와 정렬 데이터는 추후 연결됩니다. 오늘 복습의
          문제 수는 일정 연결 후 표시돼요.
        </p>
      </main>
      <footer className="fixed bottom-0 left-1/2 z-40 w-full max-w-app -translate-x-1/2 border-t border-border bg-white px-6 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4">
        <Button
          className="w-full"
          disabled={!filters.sources.length}
          onClick={() => router.push(weaknessHref(filters))}
        >
          {count === null ? "–" : count}문제 약점공략 시작
        </Button>
      </footer>
    </div>
  );
}
