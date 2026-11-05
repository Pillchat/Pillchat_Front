"use client";

import { useLearningDashboardQuery } from "@/hooks/queries/useLearningDashboardQuery";
import { dashboardAttemptHref } from "@/lib/learning/dashboard";
import { useRouter } from "@/lib/navigation";
import ResumeLearningCard from "./ResumeLearningCard";

export default function PracticeResume() {
  const router = useRouter();
  const query = useLearningDashboardQuery(true, false);
  const attempt = query.data?.latestAttempt;

  return (
    <section
      aria-labelledby="practice-resume-title"
      aria-busy={query.isPending}
    >
      <h2 id="practice-resume-title" className="text-headline-small">
        이어서 학습해요
      </h2>
      {query.isError ? (
        <p role="alert" className="mt-3 text-body-medium text-muted-foreground">
          진행 중인 학습을 불러오지 못했어요.{" "}
          <button
            type="button"
            onClick={() => void query.refetch()}
            className="text-primary underline"
          >
            다시 시도
          </button>
        </p>
      ) : query.isPending ? (
        <p
          role="status"
          className="mt-3 text-body-medium text-muted-foreground"
        >
          진행 중인 학습을 불러오는 중이에요.
        </p>
      ) : attempt ? (
        <ResumeLearningCard
          attempt={attempt}
          onClick={() => router.push(dashboardAttemptHref(attempt))}
        />
      ) : (
        <p className="mt-3 py-2 text-body-medium text-muted-foreground">
          진행 중인 학습이 없어요. 아래에서 새 문제를 골라 시작해보세요.
        </p>
      )}
    </section>
  );
}
