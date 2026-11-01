"use client";
import { useState } from "react";
import { PracticeHeader } from "@/components/molecules/PracticeHeader";
import StatsCard from "@/app/(questionbank)/questionbank/_components/StatsCard";
import { Button } from "@/components/ui/button";
import { HISTORY_FILTERS, type HistoryFilter } from "@/lib/learning/history";
import { useLearningHistory } from "@/hooks/queries/useLearningHistory";
import HistoryAttemptCard from "@/components/learning/HistoryAttemptCard";
export default function HistoryPage() {
  const [filter, setFilter] = useState<HistoryFilter>("all");
  const query = useLearningHistory(filter);
  const summary = query.data?.pages[0]?.summary;
  const items = query.data?.pages.flatMap((page) => page.items) ?? [];
  return (
    <div className="mx-auto min-h-dvh max-w-screen-sm bg-white">
      <PracticeHeader title="전체 학습 기록" backHref="/questionbank" />
      <main className="space-y-6 px-6 py-6" aria-busy={query.isPending}>
        <div className="flex gap-2">
          {[
            ["총 풀이", summary?.solvedCount],
            ["정답", summary?.correctCount],
            ["약점공략", summary?.weaknessCount],
          ].map(([label, value]) => (
            <StatsCard
              key={label}
              label={String(label)}
              value={value == null ? "–" : `${value}문제`}
            />
          ))}
        </div>
        <p className="text-body-medium text-muted-foreground">
          맞힌 문제를 포함한 모든 세트와 해설을 확인해요.
        </p>
        <div className="flex flex-wrap gap-2" aria-label="학습 기록 필터">
          {Object.entries(HISTORY_FILTERS).map(([key, label]) => (
            <Button
              key={key}
              variant={filter === key ? "default" : "outline"}
              aria-pressed={filter === key}
              onClick={() => setFilter(key as HistoryFilter)}
            >
              {label}
            </Button>
          ))}
        </div>
        {query.isPending && <p role="status">학습 기록을 불러오는 중이에요.</p>}
        {query.isError && (
          <p role="alert">
            학습 기록을 불러오지 못했어요.{" "}
            <button className="underline" onClick={() => void query.refetch()}>
              다시 시도
            </button>
          </p>
        )}
        {!query.isPending && !query.isError && items.length === 0 && (
          <p className="rounded-xl bg-accent p-4">
            {filter === "all"
              ? "아직 학습 기록이 없어요."
              : "이 조건에 맞는 학습 기록이 없어요."}
          </p>
        )}
        <div className="space-y-4">
          {items.map((entry) => (
            <HistoryAttemptCard
              key={`${entry.source}:${entry.attemptId}`}
              entry={entry}
            />
          ))}
        </div>
        {query.hasNextPage && (
          <Button
            className="w-full"
            variant="outline"
            disabled={query.isFetchingNextPage}
            onClick={() => void query.fetchNextPage()}
          >
            {query.isFetchingNextPage ? "불러오는 중..." : "더 보기"}
          </Button>
        )}
      </main>
    </div>
  );
}
