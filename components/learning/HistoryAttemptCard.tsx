"use client";
import Link from "next/link";
import QuestionBankIcon from "@/public/icons/question-bank.svg";
import {
  historyAccuracy,
  historyHref,
  type HistoryEntry,
} from "@/lib/learning/history";
import { REVIEW_SOURCE_LABELS } from "@/types/review";
import { PercentageBar } from "@/components/atoms/PercentageBar";
export default function HistoryAttemptCard({
  entry,
  returnTo,
}: {
  entry: HistoryEntry;
  returnTo?: string;
}) {
  const progress = entry.state === "IN_PROGRESS";
  const percentage = progress
    ? entry.questionCount
      ? Math.round((entry.answeredCount / entry.questionCount) * 100)
      : 0
    : historyAccuracy(entry);
  const metric = progress ? "진행률" : "정답률";
  return (
    <Link
      href={historyHref(entry, returnTo)}
      className="block rounded-xl py-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
    >
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center">
          <QuestionBankIcon
            aria-hidden="true"
            className="h-8 w-8 text-primary"
          />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-title-large">{entry.title}</h3>
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
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-body-small text-muted-foreground">
        <span>{REVIEW_SOURCE_LABELS[entry.source]}</span>
        <span>
          풀이 {entry.answeredCount}/{entry.questionCount}문제
        </span>
      </div>
      <div className="mt-4">
        <div className="mb-2 flex items-center justify-between gap-3 text-body-small">
          <span className="text-muted-foreground">{metric}</span>
          <strong className="tabular-nums text-primary">
            {percentage == null ? "–" : `${percentage}%`}
          </strong>
        </div>
        <PercentageBar value={percentage} label={`${entry.title} ${metric}`} />
      </div>
      <span className="mt-3 block text-right text-title-small text-primary">
        {progress ? "이어서 풀기" : "결과 보기"}
      </span>
    </Link>
  );
}
