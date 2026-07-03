import type { ReactNode } from "react";
import {
  BookOpen,
  ChevronRight,
  GraduationCap,
  LogOut,
  Settings,
  Target,
  Trophy,
  Zap,
} from "lucide-react";

import { AppShell, MeaninglessHeader } from "@/components/molecules";

import { QuestionBankPageNavigation } from "../_components/QuestionBankPageNavigation";

const subjectProgress = [
  {
    name: "병태생리학 (샘플)",
    solved: 0,
    accentClassName: "bg-primary-900",
  },
  {
    name: "약물학",
    solved: 0,
    accentClassName: "bg-gray-100",
  },
];

function ProgressBar({
  value,
  trackClassName = "bg-gray-100",
}: {
  value: number;
  trackClassName?: string;
}) {
  return (
    <div className={`h-2 overflow-hidden rounded-full ${trackClassName}`}>
      <div
        className="h-full rounded-full bg-primary"
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}

function SurfaceCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-[24px] border border-gray-300 bg-white shadow-[0_10px_24px_rgba(17,17,17,0.06)] ${className}`}
    >
      {children}
    </section>
  );
}

function RoundIcon({
  children,
  className = "bg-primary-980 text-primary",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${className}`}
    >
      {children}
    </span>
  );
}

function MetricCard({
  icon,
  label,
  value,
  iconClassName,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  iconClassName: string;
}) {
  return (
    <SurfaceCard className="px-4 py-4">
      <RoundIcon className={iconClassName}>{icon}</RoundIcon>
      <p className="mt-4 text-[0.8125rem] font-medium text-muted-foreground">
        {label}
      </p>
      <strong className="mt-1 block text-[1.125rem] font-extrabold text-foreground">
        {value}
      </strong>
    </SurfaceCard>
  );
}

function MenuRow({
  icon,
  label,
  showDivider,
}: {
  icon: ReactNode;
  label: string;
  showDivider?: boolean;
}) {
  return (
    <button
      type="button"
      className={`flex h-12 w-full items-center gap-3 px-4 text-left text-[0.9375rem] font-extrabold text-foreground ${
        showDivider ? "border-b border-gray-300" : ""
      }`}
    >
      <span className="text-primary">{icon}</span>
      {label}
    </button>
  );
}

export default function QuestionBankMePage() {
  return (
    <AppShell
      bottomNav={false}
      bottomSpacing="nav"
      className="flex flex-col bg-white"
    >
      <MeaninglessHeader />

      <main className="px-6 pb-10 pt-6 md:px-8">
        <header className="flex items-center gap-4">
          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary text-[1.375rem] font-extrabold text-primary-foreground">
            약
          </span>
          <div className="min-w-0">
            <p className="text-[0.875rem] font-extrabold text-muted-foreground">
              약대 4학년 · 국시 D-180
            </p>
            <h1 className="mt-1 text-[1.5rem] font-extrabold leading-8 text-foreground">
              약대생 김약사님
            </h1>
          </div>
        </header>

        <SurfaceCard className="mt-5 bg-primary-980 px-4 py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <RoundIcon className="bg-primary text-primary-foreground">
                <Target
                  aria-hidden="true"
                  className="h-5 w-5"
                  strokeWidth={2}
                />
              </RoundIcon>
              <div className="min-w-0">
                <p className="text-[0.8125rem] font-medium text-muted-foreground">
                  오늘의 퀘스트 진척도
                </p>
                <strong className="mt-1 block text-[1.125rem] font-extrabold text-foreground">
                  0/1 완료 · 0%
                </strong>
              </div>
            </div>
            <span className="shrink-0 rounded-full bg-primary px-3 py-1 text-[0.8125rem] font-extrabold text-primary-foreground shadow-[0_8px_18px_rgba(255,65,46,0.18)]">
              이번 달 18회
            </span>
          </div>
          <div className="mt-4">
            <ProgressBar value={0} trackClassName="bg-white/70" />
          </div>
          <p className="mt-3 text-right text-[0.8125rem] font-medium text-muted-foreground">
            완주 시 보너스 +100 XP
          </p>
        </SurfaceCard>

        <SurfaceCard className="mt-4 px-4 py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <RoundIcon className="bg-primary text-primary-foreground">
                <Trophy
                  aria-hidden="true"
                  className="h-5 w-5"
                  strokeWidth={2}
                />
              </RoundIcon>
              <div className="min-w-0">
                <p className="text-[0.8125rem] font-medium text-muted-foreground">
                  현재 레벨
                </p>
                <strong className="mt-1 block text-[1.25rem] font-extrabold text-foreground">
                  Lv.1{" "}
                  <span className="text-[0.8125rem] font-extrabold text-muted-foreground">
                    0 / 500 XP
                  </span>
                </strong>
              </div>
            </div>
            <span className="rounded-full bg-primary-980 px-3 py-1 text-[0.8125rem] font-extrabold text-primary">
              0%
            </span>
          </div>
          <div className="mt-4">
            <ProgressBar value={0} />
          </div>
          <p className="mt-3 text-[0.8125rem] font-medium text-muted-foreground">
            다음 레벨까지{" "}
            <span className="font-extrabold text-primary">500 XP</span> 남았어요
          </p>
        </SurfaceCard>

        <section className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <MetricCard
            icon={<BookOpen aria-hidden="true" className="h-5 w-5" />}
            iconClassName="bg-primary-980 text-primary"
            label="총 풀이 문제"
            value="0문제"
          />
          <MetricCard
            icon={<Target aria-hidden="true" className="h-5 w-5" />}
            iconClassName="bg-primary-900 text-primary"
            label="연속 학습"
            value="23일"
          />
          <MetricCard
            icon={<Zap aria-hidden="true" className="h-5 w-5" />}
            iconClassName="bg-gray-100 text-gray-800"
            label="누적 적립 XP"
            value="0"
          />
        </section>

        <button
          type="button"
          className="mt-4 flex min-h-[4.5rem] w-full items-center gap-3 rounded-[24px] border border-gray-300 bg-white px-4 text-left shadow-[0_10px_24px_rgba(17,17,17,0.06)] active:scale-[0.99]"
        >
          <RoundIcon>
            <GraduationCap
              aria-hidden="true"
              className="h-5 w-5"
              strokeWidth={1.9}
            />
          </RoundIcon>
          <span className="min-w-0 flex-1">
            <strong className="block text-[1rem] font-extrabold text-foreground">
              이미 이수한 과목 설정
            </strong>
            <span className="mt-1 block text-[0.8125rem] font-medium text-muted-foreground">
              0 / 37 과목 선택 · 지식 사슬 연결에 사용됩니다
            </span>
          </span>
          <ChevronRight
            aria-hidden="true"
            className="h-5 w-5 text-muted-foreground"
          />
        </button>

        <SurfaceCard className="mt-4 px-4 py-4">
          <h2 className="text-[1rem] font-extrabold text-foreground">
            과목 폴더별 풀이 현황
          </h2>
          <div className="mt-4 flex flex-col gap-4">
            {subjectProgress.map((subject) => (
              <div key={subject.name}>
                <div className="mb-2 flex items-center justify-between gap-3 text-[0.8125rem] font-extrabold text-foreground">
                  <span className="flex min-w-0 items-center gap-2">
                    <span
                      aria-hidden="true"
                      className={`h-3 w-3 shrink-0 rounded-full ${subject.accentClassName}`}
                    />
                    <span className="truncate">{subject.name}</span>
                  </span>
                  <span className="shrink-0 text-primary">
                    {subject.solved}문제 풀이
                  </span>
                </div>
                <ProgressBar value={0} />
              </div>
            ))}
          </div>
        </SurfaceCard>

        <SurfaceCard className="mt-5 overflow-hidden">
          <MenuRow
            icon={<BookOpen aria-hidden="true" className="h-5 w-5" />}
            label="내 학습 자료 라이브러리"
            showDivider
          />
          <MenuRow
            icon={<Settings aria-hidden="true" className="h-5 w-5" />}
            label="알림·학습 설정"
            showDivider
          />
          <MenuRow
            icon={<LogOut aria-hidden="true" className="h-5 w-5" />}
            label="로그아웃"
          />
        </SurfaceCard>
      </main>
      <QuestionBankPageNavigation />
    </AppShell>
  );
}
