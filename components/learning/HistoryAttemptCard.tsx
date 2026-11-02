"use client";
import EntryButton from "@/app/(questionbank)/questionbank/_components/EntryButton";
import QuestionBankIcon from "@/public/icons/question-bank.svg";
import { useRouter } from "@/lib/navigation";
import {
  historyAccuracy,
  historyHref,
  type HistoryEntry,
} from "@/lib/learning/history";
import { REVIEW_SOURCE_LABELS } from "@/types/review";
import { PercentageBar } from "@/components/atoms/PercentageBar";
export default function HistoryAttemptCard({ entry }: { entry: HistoryEntry }) {
  const router = useRouter();
  const progress = entry.state === "IN_PROGRESS";
  const percentage = progress
    ? entry.questionCount
      ? Math.round((entry.answeredCount / entry.questionCount) * 100)
      : 0
    : historyAccuracy(entry);
  return (
    <div className="rounded-xl border border-border px-4">
      <EntryButton
        compact
        icon={
          <QuestionBankIcon
            aria-hidden="true"
            className="h-8 w-8 text-primary"
          />
        }
        title={entry.title}
        subtitle={[
          entry.subject,
          entry.topic,
          REVIEW_SOURCE_LABELS[entry.source],
          progress
            ? `${entry.answeredCount}/${entry.questionCount}문제 · 이어서 풀기`
            : `정답률 ${percentage == null ? "–" : `${percentage}%`} · 결과보기`,
        ]
          .filter(Boolean)
          .join(" · ")}
        onClick={() => router.push(historyHref(entry))}
      />
      <div className="pb-3">
        {progress && (
          <p className="mb-2 text-body-small text-muted-foreground">
            진행률 {percentage}%
          </p>
        )}
        <PercentageBar
          value={percentage}
          label={`${entry.title} ${progress ? "진행률" : "정답률"}`}
        />
      </div>
    </div>
  );
}
