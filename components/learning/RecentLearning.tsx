"use client";
import Link from "next/link";
import { useLearningHistory } from "@/hooks/queries/useLearningHistory";
import HistoryAttemptCard from "./HistoryAttemptCard";
export default function RecentLearning() {
  const query = useLearningHistory("all", 2);
  const items = query.data?.pages[0]?.items;
  return (
    <section className="space-y-4" aria-busy={query.isPending}>
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-headline-small">최근 학습</h2>
        <Link
          href="/learning/history"
          className="text-body-medium text-primary"
        >
          전체 학습 기록
        </Link>
      </div>
      {query.isPending ? (
        <p className="text-body-medium text-muted-foreground">
          최근 학습을 불러오는 중이에요.
        </p>
      ) : query.isError ? (
        <p role="alert">
          학습 기록을 불러오지 못했어요.{" "}
          <button onClick={() => void query.refetch()} className="underline">
            다시 시도
          </button>
        </p>
      ) : items?.length ? (
        items
          .slice(0, 2)
          .map((entry) => (
            <HistoryAttemptCard
              key={`${entry.source}:${entry.attemptId}`}
              entry={entry}
            />
          ))
      ) : (
        <p className="rounded-xl bg-accent p-4 text-body-medium">
          아직 학습 기록이 없어요. 새 문제를 시작해보세요.
        </p>
      )}
    </section>
  );
}
