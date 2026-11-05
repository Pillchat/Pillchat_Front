"use client";

import Link from "next/link";
import QuestionBankIcon from "@/public/icons/question-bank.svg";
import { useLearningDashboardQuery } from "@/hooks/queries/useLearningDashboardQuery";
import { dashboardAttemptHref } from "@/lib/learning/dashboard";
import { WEAKNESS_SOURCE_LABELS } from "@/lib/learning/weakness";
import { PercentageBar } from "@/components/atoms/PercentageBar";

export default function PracticeResume() {
  const query = useLearningDashboardQuery(true, false);
  const attempt = query.data?.latestAttempt;
  const percentage = attempt?.questionCount
    ? Math.round((attempt.answeredCount / attempt.questionCount) * 100)
    : 0;

  return (
    <section
      aria-labelledby="practice-resume-title"
      aria-busy={query.isPending}
    >
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <h2 id="practice-resume-title" className="text-headline-small">
          이어서 학습해요
        </h2>
        <Link
          href="/learning/recent"
          className="inline-flex min-h-11 items-center text-body-small text-primary"
        >
          전체 최근 학습 보기
        </Link>
      </div>
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
        <Link
          href={dashboardAttemptHref(attempt)}
          className="mt-3 flex items-center gap-3 rounded-xl border border-gray-200 p-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <QuestionBankIcon
            aria-hidden="true"
            viewBox="0 0 32 32"
            className="hidden h-8 w-8 shrink-0 text-primary min-[375px]:block"
          />
          <div className="min-w-0 flex-1">
            <h3 className="break-words text-title-large">{attempt.title}</h3>
            <p className="mt-1 text-body-small text-muted-foreground">
              {[attempt.subject, WEAKNESS_SOURCE_LABELS[attempt.source]]
                .filter(Boolean)
                .join(" · ")}
            </p>
            <div className="mb-1.5 mt-3 flex flex-wrap justify-between gap-x-2 text-body-small tabular-nums">
              <span className="text-muted-foreground">
                {attempt.answeredCount}/{attempt.questionCount}문제
              </span>
              <strong>{percentage}%</strong>
            </div>
            <PercentageBar
              value={percentage}
              label={`${attempt.title} 진행률`}
            />
          </div>
          <span className="flex min-h-10 shrink-0 items-center rounded-lg bg-primary px-3 text-title-small text-white">
            이어서 풀기
          </span>
        </Link>
      ) : (
        <p className="mt-3 rounded-xl border border-gray-200 p-4 text-body-medium text-muted-foreground">
          진행 중인 학습이 없어요. 아래에서 새 문제를 골라 시작해보세요.
        </p>
      )}
    </section>
  );
}
