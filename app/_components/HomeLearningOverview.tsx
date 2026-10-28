"use client";

import { Play, RotateCcw } from "lucide-react";
import QuestionBankIcon from "@/public/icons/question-bank.svg";
import EntryButton from "@/app/(questionbank)/questionbank/_components/EntryButton";
import StatsCard from "@/app/(questionbank)/questionbank/_components/StatsCard";
import {
  dashboardAttemptHref,
  formatStudyTime,
  type LearningDashboard,
} from "@/lib/learning/dashboard";
import { useRouter } from "@/lib/navigation";

type Props = {
  data?: LearningDashboard;
  pending: boolean;
  isError: boolean;
  onRetry: () => void;
};

export default function HomeLearningOverview({
  data,
  pending,
  isError,
  onRetry,
}: Props) {
  const router = useRouter();
  const latest = data?.latestAttempt;
  const accuracy = data
    ? `${data.solvedCount ? Math.round((data.correctCount / data.solvedCount) * 100) : 0}%`
    : "–";

  return (
    <div className="mt-6 space-y-6 px-5 pb-6 md:px-10">
      <section aria-labelledby="today-learning-title" aria-busy={pending}>
        <h2 id="today-learning-title" className="text-headline-small">
          오늘의 학습 현황
        </h2>
        <div className="mt-3 flex gap-2" aria-live="polite">
          <StatsCard
            valueClassName="text-sm min-[375px]:text-base sm:text-xl"
            label="학습 문제"
            value={data ? `${data.solvedCount}문제` : "–"}
          />
          <StatsCard
            valueClassName="text-sm min-[375px]:text-base sm:text-xl"
            label="정답률"
            value={accuracy}
          />
          <StatsCard
            valueClassName="text-sm min-[375px]:text-base sm:text-xl"
            label="학습 시간"
            value={data ? formatStudyTime(data.studySeconds) : "–"}
          />
        </div>
      </section>

      {isError && (
        <p role="alert" className="text-body-medium text-destructive">
          학습 현황을 불러오지 못했어요.
          <button type="button" className="ml-2 underline" onClick={onRetry}>
            다시 시도
          </button>
        </p>
      )}

      <section aria-labelledby="continue-learning-title" aria-busy={pending}>
        <h2 id="continue-learning-title" className="text-headline-small">
          이어서 풀기
        </h2>
        {latest ? (
          <div className="mt-3 rounded-xl border border-primary-900 bg-primary-980 px-4">
            <EntryButton
              compact
              icon={
                <Play
                  aria-hidden="true"
                  size={32}
                  className="h-8 w-8 text-primary"
                  strokeWidth={1.5}
                  absoluteStrokeWidth
                />
              }
              title={latest.title}
              subtitle={`${latest.answeredCount} / ${latest.questionCount}문제 · 이어서 풀기`}
              onClick={() => router.push(dashboardAttemptHref(latest))}
            />
          </div>
        ) : (
          <p className="mt-3 rounded-xl bg-gray-50 p-4 text-body-medium text-muted-foreground">
            {pending
              ? "최근 학습 기록을 불러오는 중이에요."
              : isError
                ? "최근 학습 기록을 확인하지 못했어요."
                : "진행 중인 문제풀이가 없어요. 새로운 학습을 시작해 보세요."}
          </p>
        )}
      </section>

      <section aria-labelledby="learning-shortcuts-title">
        <h2 id="learning-shortcuts-title" className="text-headline-small">
          학습 바로가기
        </h2>
        <div className="mt-1 divide-y divide-border">
          <EntryButton
            compact
            icon={
              <QuestionBankIcon
                aria-hidden="true"
                className="h-8 w-8 text-primary"
              />
            }
            title="수제 제작 문제"
            subtitle="전문가가 직접 만들고 검수한 문제를 풀어요"
            onClick={() => router.push("/questionbank/handcrafted")}
          />
          <EntryButton
            compact
            icon={
              <RotateCcw
                aria-hidden="true"
                size={32}
                className="h-8 w-8 text-primary"
                strokeWidth={1.5}
                absoluteStrokeWidth
              />
            }
            title="약점공략"
            subtitle="틀린 문제를 다시 풀며 약점을 채워요"
            onClick={() => router.push("/learning/weakness")}
          />
        </div>
      </section>
    </div>
  );
}
