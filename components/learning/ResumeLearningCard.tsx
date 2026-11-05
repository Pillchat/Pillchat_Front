"use client";

import { Play } from "lucide-react";
import EntryButton from "@/app/(questionbank)/questionbank/_components/EntryButton";
import { PercentageBar } from "@/components/atoms/PercentageBar";
import type { DashboardAttempt } from "@/lib/learning/dashboard";
import { WEAKNESS_SOURCE_LABELS } from "@/lib/learning/weakness";

export default function ResumeLearningCard({
  attempt,
  onClick,
}: {
  attempt: DashboardAttempt;
  onClick: () => void;
}) {
  return (
    <div className="mt-2">
      <EntryButton
        compact
        icon={
          <Play
            aria-hidden="true"
            size={32}
            className="h-8 w-8 text-primary"
            strokeWidth={2}
            absoluteStrokeWidth
          />
        }
        title={attempt.title}
        subtitle={[
          attempt.subject,
          attempt.topic,
          WEAKNESS_SOURCE_LABELS[attempt.source],
          `${attempt.answeredCount} / ${attempt.questionCount}문제 · 이어서 풀기`,
        ]
          .filter(Boolean)
          .join(" · ")}
        onClick={onClick}
      />
      <PercentageBar
        label="풀이 진행률"
        className="mb-4 h-2"
        value={
          attempt.questionCount
            ? (attempt.answeredCount / attempt.questionCount) * 100
            : 0
        }
      />
    </div>
  );
}
