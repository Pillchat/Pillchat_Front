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
export default function HistoryAttemptCard({ entry }: { entry: HistoryEntry }) {
  const router = useRouter();
  const progress = entry.state === "IN_PROGRESS";
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
            : `정답률 ${historyAccuracy(entry)}% · 결과보기`,
        ]
          .filter(Boolean)
          .join(" · ")}
        onClick={() => router.push(historyHref(entry))}
      />
      {progress && (
        <p className="pb-3 text-body-small text-muted-foreground">
          진행률{" "}
          {entry.questionCount
            ? Math.round((entry.answeredCount / entry.questionCount) * 100)
            : 0}
          %
        </p>
      )}
    </div>
  );
}
