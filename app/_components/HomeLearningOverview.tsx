"use client";

import { Play, RotateCcw } from "lucide-react";
import QuestionBankIcon from "@/public/icons/question-bank.svg";
import EntryButton from "@/app/(questionbank)/questionbank/_components/EntryButton";
import StatsCard from "@/app/(questionbank)/questionbank/_components/StatsCard";
import {
  dashboardAttemptHref,
  type LearningDashboard,
} from "@/lib/learning/dashboard";
import { useRouter } from "@/lib/navigation";
import HomeWeeklyReport from "./HomeWeeklyReport";
import { WEAKNESS_SOURCE_LABELS } from "@/lib/learning/weakness";

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
    <div className="mt-6 space-y-6 px-6 pb-6 md:px-10">
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
          {data && !latest && !pending && !isError
            ? "추천 문제 풀기"
            : "이어서 풀기"}
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
              subtitle={[
                latest.subject,
                latest.topic,
                WEAKNESS_SOURCE_LABELS[latest.source],
                `${latest.answeredCount} / ${latest.questionCount}문제 · 이어서 풀기`,
              ]
                .filter(Boolean)
                .join(" · ")}
              onClick={() => router.push(dashboardAttemptHref(latest))}
            />
            <progress
              aria-label="풀이 진행률"
              className="mb-4 h-2 w-full appearance-none overflow-hidden rounded-full [&::-moz-progress-bar]:bg-primary [&::-webkit-progress-bar]:bg-primary-900 [&::-webkit-progress-value]:bg-primary"
              max={Math.max(latest.questionCount, 1)}
              value={latest.answeredCount}
            />
          </div>
        ) : data && !pending && !isError ? (
          <div className="mt-3 rounded-xl border border-primary-900 bg-primary-980 px-4">
            <EntryButton
              compact
              icon={
                <QuestionBankIcon
                  aria-hidden="true"
                  className="h-8 w-8 text-primary"
                />
              }
              title="추천 문제 풀기"
              subtitle="아직 풀지 않은 수제 제작 문제를 시작해요"
              onClick={() => router.push("/questionbank/handcrafted")}
            />
          </div>
        ) : (
          <p className="mt-3 rounded-xl bg-gray-50 p-4 text-body-medium text-muted-foreground">
            {pending
              ? "최근 학습 기록을 불러오는 중이에요."
              : isError
                ? "최근 학습 기록을 확인하지 못했어요."
                : "최근 학습 기록을 불러오는 중이에요."}
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
            subtitle="오답·헷갈린 문제를 다시 풀며 약점을 채워요"
            onClick={() => router.push("/learning/weakness")}
          />
        </div>
      </section>
      <HomeWeeklyReport
        weekly={data?.weekly}
        pending={pending}
        isError={isError}
      />
    </div>
  );
}
