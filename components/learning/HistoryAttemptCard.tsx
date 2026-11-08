"use client";
import Link from "next/link";
import LearningSourceIcon from "@/components/learning/LearningSourceIcon";
import {
  historyAccuracy,
  historyHref,
  type HistoryEntry,
} from "@/lib/learning/history";
import { learningSourceLabel } from "@/lib/learning/attemptLabels";
export default function HistoryAttemptCard({
  entry,
  returnTo,
  onOpen,
}: {
  entry: HistoryEntry;
  returnTo?: string;
  onOpen?: (element: HTMLAnchorElement) => void;
}) {
  const progress = entry.state === "IN_PROGRESS";
  const percentage = progress
    ? entry.questionCount
      ? Math.round((entry.answeredCount / entry.questionCount) * 100)
      : 0
    : historyAccuracy(entry);
  const metric = progress ? "진행률" : "정답률";
  const sourceLabel = learningSourceLabel(entry.source, entry.title);
  return (
    <Link
      href={historyHref(entry, returnTo)}
      data-history-attempt={`${entry.source}:${entry.attemptId}`}
      onClick={(event) => onOpen?.(event.currentTarget)}
      className="block rounded-xl py-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
    >
      <div className="flex items-start gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center">
          <LearningSourceIcon
            source={entry.source}
            className="h-6 w-6 text-primary"
          />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <h3 className="min-w-0 break-words text-title-large">
              {entry.title}
            </h3>
            <span className="shrink-0 text-title-small text-primary">
              {progress ? "이어서 풀기" : "결과 보기"}
            </span>
          </div>
          {entry.subject && (
            <p className="mt-1 text-body-small text-muted-foreground">
              {entry.subject}
            </p>
          )}
          {entry.topic && (
            <p className="text-body-small text-muted-foreground">
              {entry.topic}
            </p>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-body-small text-muted-foreground">
            {sourceLabel && <span>{sourceLabel}</span>}
            <span>
              응답 {entry.answeredCount}/{entry.questionCount}문제
            </span>
            <span className="inline-flex items-center gap-1">
              <span>{metric}</span>
              <strong className="tabular-nums text-primary">
                {percentage == null ? "–" : `${percentage}%`}
              </strong>
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
