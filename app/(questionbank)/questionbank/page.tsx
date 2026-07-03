import Link from "next/link";
import {
  BookOpenCheck,
  ChevronRight,
  Flame,
  Monitor,
  NotebookPen,
  PenLine,
  Star,
  Target,
  Trophy,
} from "lucide-react";

import { AppShell, MeaninglessHeader } from "@/components/molecules";

import { QuestionBankPageNavigation } from "./_components/QuestionBankPageNavigation";

const questItems = [
  {
    href: "/questionbank/generate",
    marker: "star",
    title: "[체험 가이드] 샘플 데이터로 문제 풀기",
    description: "약대생 검수 문제 · 문제당",
    xp: "+50 XP",
    action: "체험",
  },
  {
    href: "/questionbank/premium",
    marker: "2",
    title: "막막 혈관병 원인 3가지 마스터하기",
    description: "AI 자동 출제 · 문제당",
    xp: "+240 XP",
    action: "시작",
  },
  {
    href: "/questionbank/review",
    marker: "3",
    title: "약물학 5문제 풀기",
    description: "자료 기반 자동 출제 · 문제당",
    xp: "+240 XP",
    action: "시작",
  },
];

export default function QuestionBankPage() {
  return (
    <AppShell
      bottomNav={false}
      bottomSpacing="nav"
      className="flex flex-col bg-white"
    >
      <MeaninglessHeader />

      <main className="flex flex-1 flex-col px-6 pb-7 pt-6 md:px-8">
        <section className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-muted-foreground">
              안녕하세요, 약대생님
            </p>
            <h1 className="mt-2 flex flex-wrap items-center gap-2 text-[1.625rem] font-extrabold leading-9 text-foreground">
              오늘도 국시 한 걸음 더
            </h1>
          </div>
          <div className="flex h-12 shrink-0 items-center gap-2 rounded-full bg-primary-980 px-4 text-primary">
            <Flame aria-hidden="true" className="h-5 w-5" strokeWidth={2.2} />
            <span className="text-lg font-extrabold">23일</span>
          </div>
        </section>

        <section
          aria-labelledby="quest-progress-title"
          className="mt-8 rounded-[28px] border border-primary-900 bg-primary-980 px-5 py-5 shadow-[0_12px_30px_rgba(17,17,17,0.05)]"
        >
          <div className="flex flex-col gap-4 min-[390px]:flex-row min-[390px]:items-center min-[390px]:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-[3.25rem] w-[3.25rem] shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_8px_18px_rgba(255,65,46,0.18)]">
                <Target
                  aria-hidden="true"
                  className="h-7 w-7"
                  strokeWidth={2}
                />
              </div>
              <div className="min-w-0">
                <p
                  id="quest-progress-title"
                  className="text-sm font-bold leading-5 text-muted-foreground"
                >
                  오늘의 퀘스트
                </p>
                <p className="mt-1 whitespace-nowrap text-[1.75rem] font-extrabold leading-none text-foreground">
                  0/3 완료
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 min-[390px]:flex-col min-[390px]:items-end">
              <div className="flex h-9 shrink-0 items-center gap-2 rounded-full bg-primary px-3.5 text-sm font-extrabold text-primary-foreground">
                <Trophy
                  aria-hidden="true"
                  className="h-4 w-4"
                  strokeWidth={2.1}
                />
                18회
              </div>
              <div className="rounded-full bg-white px-3 py-1 text-xs font-extrabold text-primary">
                진척률 0%
              </div>
            </div>
          </div>

          <div aria-hidden="true" className="mt-5 grid grid-cols-3 gap-2">
            <span className="h-2.5 rounded-full bg-white shadow-[inset_0_0_0_1px_rgba(255,65,46,0.04)]" />
            <span className="h-2.5 rounded-full bg-white shadow-[inset_0_0_0_1px_rgba(255,65,46,0.04)]" />
            <span className="h-2.5 rounded-full bg-white shadow-[inset_0_0_0_1px_rgba(255,65,46,0.04)]" />
          </div>

          <div className="mt-4 flex items-center justify-between gap-3 text-xs font-semibold text-muted-foreground">
            <span>오늘 0개 완료</span>
            <span className="text-right">완주 보너스 +100 XP</span>
          </div>
        </section>

        <section
          aria-labelledby="today-quest-title"
          className="mt-4 overflow-hidden rounded-[24px] border border-border bg-white shadow-[0_12px_30px_rgba(17,17,17,0.05)]"
        >
          <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
            <div className="flex min-w-0 items-center gap-2">
              <Target
                aria-hidden="true"
                className="h-5 w-5 shrink-0 text-primary"
                strokeWidth={2.2}
              />
              <h2
                id="today-quest-title"
                className="text-xl font-extrabold text-foreground"
              >
                오늘의 퀘스트
              </h2>
            </div>
            <span className="rounded-full bg-primary-980 px-3 py-1 text-xs font-bold text-primary">
              자물쇠 해제됨
            </span>
          </div>

          <p className="px-5 pb-3 pt-4 text-sm leading-6 text-muted-foreground">
            샘플 학습으로 바로 시작하거나, 내 과목 폴더 자료를 기반으로 AI가
            문제를 만들어 드려요.
          </p>

          <div>
            {questItems.map((item, index) => (
              <QuestRow key={item.href} item={item} index={index} />
            ))}
          </div>
        </section>

        <section
          aria-label="학습 방식 선택"
          className="mt-6 grid grid-cols-2 gap-4"
        >
          <Link
            href="/learn/cbt"
            className="flex min-h-[13.25rem] flex-col rounded-[28px] bg-primary p-6 text-primary-foreground shadow-[0_14px_30px_rgba(255,65,46,0.18)] transition-transform active:scale-[0.98]"
            prefetch={false}
          >
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/20">
              <Monitor
                aria-hidden="true"
                className="h-8 w-8"
                strokeWidth={1.9}
              />
            </span>
            <strong className="mt-auto block text-xl font-extrabold leading-7">
              CBT 형태로
              <br />
              학습하기
            </strong>
            <span className="mt-3 text-sm font-medium text-white/90">
              국시 컴퓨터 시험 모드
            </span>
          </Link>

          <Link
            href="/wrongnote/exams/ipad"
            className="flex min-h-[13.25rem] flex-col rounded-[28px] border-2 border-primary-900 bg-white p-6 text-foreground shadow-[0_10px_24px_rgba(17,17,17,0.04)] transition-transform active:scale-[0.98]"
            prefetch={false}
          >
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-980 text-primary">
              <PenLine
                aria-hidden="true"
                className="h-8 w-8"
                strokeWidth={1.9}
              />
            </span>
            <strong className="mt-auto block text-xl font-extrabold leading-7">
              학교 시험지
              <br />
              형태로 학습하기
            </strong>
            <span className="mt-3 text-sm font-medium text-muted-foreground">
              지필 시험 미리보기
            </span>
          </Link>
        </section>

        <Link
          href="/questionbank/my-tasks"
          className="mt-6 flex min-h-20 items-center gap-4 rounded-[24px] border border-border bg-white px-6 py-5 shadow-[0_12px_28px_rgba(17,17,17,0.05)] transition-transform active:scale-[0.98]"
          prefetch={false}
        >
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <BookOpenCheck
              aria-hidden="true"
              className="h-8 w-8"
              strokeWidth={1.8}
            />
          </span>
          <span className="min-w-0 flex-1">
            <strong className="block text-lg font-extrabold leading-6 text-foreground">
              약대생이 직접 만들고 검수한 문제
            </strong>
            <span className="mt-2 block text-sm leading-5 text-muted-foreground">
              현직 약대생이 출제·검수한 핵심 개념 문제를 풀어보세요
            </span>
          </span>
          <ChevronRight
            aria-hidden="true"
            className="h-6 w-6 shrink-0 text-primary"
            strokeWidth={2.1}
          />
        </Link>

        <Link
          href="/questionbank/review"
          className="mt-6 flex min-h-20 items-center gap-4 rounded-[28px] bg-primary px-6 py-5 text-primary-foreground shadow-[0_14px_30px_rgba(255,65,46,0.18)] transition-transform active:scale-[0.98]"
          prefetch={false}
        >
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white/20">
            <NotebookPen
              aria-hidden="true"
              className="h-8 w-8"
              strokeWidth={1.8}
            />
          </span>
          <span className="min-w-0 flex-1">
            <strong className="block text-xl font-extrabold">
              오답 노트 복습
            </strong>
            <span className="mt-2 block text-sm font-medium text-white/90">
              틀린 문제로 바로 풀이를 시작합니다
            </span>
          </span>
          <BookOpenCheck
            aria-hidden="true"
            className="h-8 w-8 shrink-0"
            strokeWidth={1.8}
          />
        </Link>
      </main>
      <QuestionBankPageNavigation />
    </AppShell>
  );
}

function QuestRow({
  item,
  index,
}: {
  item: (typeof questItems)[number];
  index: number;
}) {
  const marker =
    item.marker === "star" ? (
      <Star aria-hidden="true" className="h-5 w-5 fill-current" />
    ) : (
      item.marker
    );

  return (
    <Link
      href={item.href}
      className="flex min-h-[5.625rem] items-center gap-3 border-t border-border px-5 py-4 transition-colors first:border-t-0 active:bg-primary-980"
      prefetch={false}
    >
      <span
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border text-base font-extrabold ${
          index === 0
            ? "border-primary bg-primary-980 text-primary"
            : index === 1
              ? "border-primary-800 bg-primary-980 text-primary"
              : "border-gray-300 bg-gray-100 text-gray-800"
        }`}
      >
        {marker}
      </span>
      <span className="min-w-0 flex-1">
        <strong className="block truncate text-base font-extrabold text-foreground">
          {item.title}
        </strong>
        <span className="mt-1 block truncate text-sm text-muted-foreground">
          {item.description}{" "}
          <span className="font-extrabold text-primary">{item.xp}</span>
        </span>
      </span>
      <span className="flex h-10 shrink-0 items-center gap-1 rounded-full bg-primary px-4 text-sm font-extrabold text-primary-foreground">
        {item.action}
        <ChevronRight aria-hidden="true" className="h-4 w-4" strokeWidth={2} />
      </span>
    </Link>
  );
}
