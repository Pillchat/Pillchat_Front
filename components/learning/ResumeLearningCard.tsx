"use client";

import { Play } from "lucide-react";
import EntryButton from "@/app/(questionbank)/questionbank/_components/EntryButton";
import type { DashboardAttempt } from "@/lib/learning/dashboard";
import { learningSourceLabel } from "@/lib/learning/attemptLabels";

export default function ResumeLearningCard({
  attempt,
  onClick,
}: {
  attempt: DashboardAttempt;
  onClick: () => void;
}) {
  const percentage = attempt.questionCount
    ? Math.min(
        100,
        Math.max(
          0,
          Math.round((attempt.answeredCount / attempt.questionCount) * 100),
        ),
      )
    : 0;
  return (
    <div className="mt-2">
      <EntryButton
        compact
        icon={
          <Play
            aria-hidden="true"
            className="h-6 w-6 text-primary"
            strokeWidth={1.5}
          />
        }
        title={attempt.title}
        subtitle={
          <>
            <span className="block">
              {[
                attempt.subject,
                attempt.topic,
                learningSourceLabel(attempt.source, attempt.title),
              ]
                .filter(Boolean)
                .join(" · ")}
            </span>
            <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-body-small">
              <span>
                응답 {attempt.answeredCount}/{attempt.questionCount}문제
              </span>
              <span>
                진행률{" "}
                <strong className="font-semibold tabular-nums text-primary">
                  {percentage}%
                </strong>
              </span>
              <span className="text-primary">이어서 풀기</span>
            </span>
          </>
        }
        onClick={onClick}
      />
    </div>
  );
}
