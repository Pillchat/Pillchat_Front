"use client";

import { TutorialButton } from "@/components/learning/TutorialButton";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpenCheck,
  Calculator,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Clock3,
  Columns2,
  ListChecks,
  Play,
  RotateCcw,
  StickyNote,
} from "lucide-react";
import { PracticeHeader } from "@/components/molecules";
import { LoadingIndicator } from "@/components/atoms/LoadingIndicator";
import type { LearningSession } from "@/hooks/useLearningSession";
import {
  cbtAnswer,
  cbtQuestion,
  choicePatch,
  formatDuration,
} from "@/lib/learning/presentation";
import { SessionFeedback, AttemptHistory } from "./SessionFeedback";
import { PracticeResult } from "./PracticeResult";
import {
  CalculatorDialog,
  CheckRow,
  ChoiceCard,
  Dialog,
  FlowPage,
  InfoGrid,
  ModeCard,
  NavButton,
  PrimaryButton,
  QuestionListDialog,
  QuestionPane,
  SaveStateBadge,
  SecondaryButton,
  SubmitDialog,
  type AnswerState,
  type ListFilter,
} from "./CbtPresentation";

const Tutorial = dynamic(
  () => import("@/app/(learn)/learning/cbt/_components/LegacyPractice"),
  { ssr: false },
);
type Stage =
  | "hub"
  | "session-select"
  | "exam-info"
  | "device-check"
  | "consent"
  | "ready";
export default function CbtPractice({
  session: s,
}: {
  session: LearningSession;
}) {
  const [tutorial, setTutorial] = useState(false);
  const [stage, setStage] = useState<Stage>("hub");
  const [bankId, setBank] = useState("");
  const [ordinal, setOrdinal] = useState(0);
  const [quick, setQuick] = useState(false);
  const [readable, setReadable] = useState(false);
  const [touch, setTouch] = useState(false);
  const [consented, setConsented] = useState(false);
  const [fontScale, setFontScale] = useState<80 | 100 | 125>(100);
  const [double, setDouble] = useState(false);
  const [width, setWidth] = useState(0);
  const [note, setNote] = useState<string | null>(null);
  const [unknown, setUnknown] = useState<Record<string, boolean>>({});
  const [listFilter, setListFilter] = useState<ListFilter>("all");
  const [listOpen, setListOpen] = useState(false);
  const [calculator, setCalculator] = useState(false);
  const [submitOpen, setSubmitOpen] = useState(false);
  const [exitOpen, setExitOpen] = useState(false);
  useEffect(() => {
    const resize = () => setWidth(window.innerWidth);
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);
  useEffect(() => {
    if (!s.attempt) {
      setStage("hub");
      setUnknown({});
      setSubmitOpen(false);
      setExitOpen(false);
    }
  }, [s.attempt?.attemptId]);
  useEffect(() => {
    if (
      !Object.keys(s.memos).length ||
      s.disabled ||
      s.error ||
      s.attempt?.state !== "IN_PROGRESS"
    )
      return;
    const timer = setTimeout(() => void s.flushMemos(), 700);
    return () => clearTimeout(timer);
  }, [s.memos, s.disabled, s.error, s.attempt?.state]);
  useEffect(() => {
    if (s.attempt?.state !== "IN_PROGRESS") {
      setSubmitOpen(false);
      setListOpen(false);
    }
  }, [s.attempt?.state]);
  const bank =
    s.catalog?.banks.find((b) => b.bankId === bankId) ?? s.catalog?.banks[0];
  const sections = bank?.sections.filter((section) => section.available) ?? [];
  const selectedSections = ordinal
    ? sections.filter((section) => section.ordinal === ordinal)
    : sections;
  const duration = selectedSections.every(
    (section) => section.durationSec != null,
  )
    ? selectedSections.reduce(
        (sum, section) => sum + (section.durationSec ?? 0),
        0,
      ) * (ordinal && quick ? 0.5 : 1)
    : null;
  const total = selectedSections.reduce(
    (sum, section) => sum + section.questionCount,
    0,
  );
  const attempt = s.attempt;
  const questions = useMemo(
    () => (attempt?.currentSectionQuestions ?? []).map(cbtQuestion),
    [attempt?.currentSectionQuestions],
  );
  const answers = useMemo(
    () =>
      Object.fromEntries(
        (attempt?.currentSectionQuestions ?? []).map((q) => [
          q.attemptQuestionId,
          {
            ...cbtAnswer(
              q,
              attempt?.savedAnswers.find(
                (a) => a.attemptQuestionId === q.attemptQuestionId,
              ),
              s.memos[q.attemptQuestionId],
            ),
            unknown: !!unknown[q.attemptQuestionId],
          },
        ]),
      ),
    [attempt, s.memos, unknown],
  );
  const summary = {
    total: questions.length,
    answered: questions.filter((q) => answers[q.id]?.selectedChoice != null)
      .length,
    unanswered: questions.filter((q) => answers[q.id]?.selectedChoice == null)
      .length,
    flagged: questions.filter((q) => answers[q.id]?.flagged).length,
    unknown: questions.filter((q) => answers[q.id]?.unknown).length,
  };
  const locked =
    s.disabled || attempt?.state !== "IN_PROGRESS" || s.remaining === 0;
  const section = attempt?.sections.find(
    (item) => item.sectionId === attempt.currentSectionId,
  );
  const displayed = questions.slice(
    s.index,
    s.index + (double && width >= 1180 ? 2 : 1),
  );
  const filtered = questions.filter((q) =>
    listFilter === "flagged"
      ? answers[q.id]?.flagged
      : listFilter === "unanswered"
        ? answers[q.id]?.selectedChoice == null
        : true,
  );
  const patch = (id: string, change: Partial<AnswerState>) => {
    const question = attempt?.currentSectionQuestions.find(
      (q) => q.attemptQuestionId === id,
    );
    if (
      !question ||
      locked ||
      attempt?.savedAnswers.find((answer) => answer.attemptQuestionId === id)
        ?.finalized
    )
      return;
    if ("unknown" in change) {
      setUnknown((previous) => ({ ...previous, [id]: !!change.unknown }));
      return;
    }
    if ("memo" in change) {
      s.setMemo(id, change.memo ?? "");
      return;
    }
    void s.writeAnswers(id, choicePatch(question, change), id);
  };
  const go = (id: string) => {
    if (!s.disabled) void s.navigate(id);
  };
  const leave = async () => {
    if (await s.leave()) {
      setExitOpen(false);
      setStage("hub");
    }
  };
  if (tutorial)
    return (
      <Tutorial tutorialOnly onTutorialComplete={() => setTutorial(false)} />
    );
  if (s.result)
    return <PracticeResult session={s} onTutorial={() => setTutorial(true)} />;
  if (s.loading)
    return (
      <div className="min-h-dvh bg-white">
        <PracticeHeader
          title="약사국시 CBT 실전 연습"
          rightSlot={<TutorialButton onClick={() => setTutorial(true)} />}
        />
        <LoadingIndicator
          label="문제 목록을 불러오는 중..."
          className="py-20"
        />
      </div>
    );
  const feedback = <SessionFeedback session={s} />;
  const bankPicker = s.catalog && s.catalog.banks.length > 1 && (
    <fieldset disabled={s.disabled} className="mt-5">
      <legend className="text-sm font-bold">시험 선택</legend>
      <div className="mt-3 flex flex-wrap gap-2">
        {s.catalog.banks.map((item) => (
          <button
            type="button"
            key={item.bankId}
            onClick={() => {
              setBank(item.bankId);
              setOrdinal(0);
            }}
            className={`rounded-xl border px-4 py-3 text-sm ${bank?.bankId === item.bankId ? "border-primary bg-brandSecondary text-primary" : "border-border"}`}
          >
            {item.title}
          </button>
        ))}
      </div>
    </fieldset>
  );
  if (!attempt) {
    if (stage === "hub")
      return (
        <main className="min-h-dvh bg-white pb-8">
          <PracticeHeader
            title="약사국시 CBT 실전 연습"
            rightSlot={<TutorialButton onClick={() => setTutorial(true)} />}
          />
          {feedback}
          <div className="mx-auto max-w-[1024px] px-4 sm:px-6">
            <section className="mt-7">
              <h1 className="text-xl font-semibold leading-snug sm:text-2xl">
                실제 시험 흐름으로
                <br />
                시간 관리와 답안 선택을 연습해요
              </h1>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                국시원 공식 서비스가 아닌 필챗 학습용 모의 기능입니다.
              </p>
            </section>
            {bankPicker}
            <AttemptHistory session={s} />
            <div className="mt-5 flex flex-col gap-3">
              <ModeCard
                icon={<BookOpenCheck className="h-7 w-7 text-primary" />}
                title="교시별 연습"
                description="교시와 연습 시간 선택"
                disabled={s.disabled || !sections.length}
                onClick={() => setStage("session-select")}
              />
              <ModeCard
                icon={<Clock3 className="h-7 w-7 text-primary" />}
                title={`전체 ${sections.length || ""}교시 실전`}
                description={`${sections.reduce((n, item) => n + item.questionCount, 0)}문항 · 쉬는 시간 포함`}
                disabled={
                  s.disabled ||
                  !sections.length ||
                  sections.length !== bank?.sections.length
                }
                onClick={() => {
                  setOrdinal(0);
                  setQuick(false);
                  setStage("exam-info");
                }}
              />
              <Link
                href="/learning/review"
                className="flex min-h-24 items-center gap-4 rounded-2xl bg-accent/50 p-5"
              >
                <RotateCcw className="h-7 w-7 text-primary" />
                <div>
                  <strong className="block">오답 복습</strong>
                  <span className="mt-1 block text-sm text-muted-foreground">
                    제출한 문제의 오답·미응답 복습
                  </span>
                </div>
              </Link>
            </div>
            {!sections.length && (
              <p className="mt-6 text-sm text-muted-foreground">
                아직 공개된 시험이 없습니다.
              </p>
            )}
          </div>
        </main>
      );
    if (stage === "session-select")
      return (
        <FlowPage
          rightSlot={<TutorialButton onClick={() => setTutorial(true)} />}
          title="교시 선택"
          onBack={() => setStage("hub")}
        >
          {feedback}
          {bankPicker}
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {sections.map((item) => (
              <button
                type="button"
                key={item.ordinal}
                disabled={s.disabled}
                onClick={() => {
                  setOrdinal(item.ordinal);
                  setStage("exam-info");
                }}
                className="min-h-36 rounded-2xl bg-accent/60 p-5 text-left hover:bg-primary-980"
              >
                <span className="text-sm font-extrabold text-primary">
                  {item.title}
                </span>
                <strong className="mt-2 block text-xl font-extrabold">
                  {bank?.title}
                </strong>
                <span className="mt-3 block text-sm text-muted-foreground">
                  {item.questionCount}문항 · {formatDuration(item.durationSec)}
                </span>
              </button>
            ))}
          </div>
        </FlowPage>
      );
    if (stage === "exam-info")
      return (
        <FlowPage
          rightSlot={<TutorialButton onClick={() => setTutorial(true)} />}
          title="시험 정보·시간 설정"
          onBack={() => setStage(ordinal ? "session-select" : "hub")}
        >
          {feedback}
          <InfoGrid
            items={[
              ["시험 세트", bank?.title ?? ""],
              ["응시 교시", selectedSections.map((s) => s.title).join(" · ")],
              ["문항 수", `${total}문항`],
              ["제한시간", formatDuration(duration)],
            ]}
          />
          {ordinal > 0 && (
            <section className="mt-6">
              <h2 className="font-extrabold">연습 시간</h2>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <ChoiceCard
                  active={!quick}
                  title="실전 시간"
                  description="실제 교시 제한시간으로 연습"
                  onClick={() => setQuick(false)}
                />
                <ChoiceCard
                  active={quick}
                  title="빠른 연습"
                  description="문항은 유지하고 시간을 50%로 단축"
                  onClick={() => setQuick(true)}
                />
              </div>
            </section>
          )}
          <PrimaryButton
            disabled={!total}
            onClick={() => setStage("device-check")}
          >
            다음
          </PrimaryButton>
        </FlowPage>
      );
    if (stage === "device-check")
      return (
        <FlowPage
          rightSlot={<TutorialButton onClick={() => setTutorial(true)} />}
          title="기기 확인"
          onBack={() => setStage("exam-info")}
        >
          <CheckRow
            checked={true}
            title={width < 1024 ? "모바일 화면" : "가로 화면"}
            description="화면 크기에 맞춘 응시 화면을 사용합니다."
            readOnly
          />
          <CheckRow
            checked={readable}
            title="화면 가독성"
            description="문제와 선택지 글자가 선명하게 보입니다."
            onChange={setReadable}
          />
          <CheckRow
            checked={touch}
            title="터치 동작"
            description="버튼과 선택지를 문제없이 터치할 수 있습니다."
            onChange={setTouch}
          />
          <PrimaryButton
            disabled={!readable || !touch}
            onClick={() => setStage("consent")}
          >
            다음
          </PrimaryButton>
        </FlowPage>
      );
    if (stage === "consent")
      return (
        <FlowPage
          rightSlot={<TutorialButton onClick={() => setTutorial(true)} />}
          title="유의사항·동의"
          onBack={() => setStage("device-check")}
        >
          <ul className="space-y-3 rounded-2xl bg-accent/40 p-5 text-sm leading-6">
            {[
              "시간이 종료되면 답안이 자동 제출됩니다.",
              "시험 중에는 정답과 해설이 보이지 않습니다.",
              "앱을 나가도 시험 시간은 계속 흐릅니다.",
              "문항과 자료를 외부에 무단 배포할 수 없습니다.",
            ].map((item) => (
              <li key={item} className="flex gap-2">
                <Check className="mt-1 h-4 w-4 shrink-0 text-primary" />
                {item}
              </li>
            ))}
          </ul>
          <label className="mt-5 flex min-h-14 items-center gap-3 rounded-xl bg-accent/40 px-4 py-3 text-sm font-semibold">
            <input
              type="checkbox"
              checked={consented}
              onChange={(event) => setConsented(event.target.checked)}
              className="h-5 w-5 accent-primary"
            />
            유의사항을 확인했고 연습 응시에 동의합니다.
          </label>
          <PrimaryButton
            disabled={!consented}
            onClick={() => setStage("ready")}
          >
            동의하고 다음
          </PrimaryButton>
        </FlowPage>
      );
    return (
      <FlowPage
        rightSlot={<TutorialButton onClick={() => setTutorial(true)} />}
        title="시험 시작 대기"
        onBack={() => setStage("consent")}
      >
        {feedback}
        <div className="rounded-2xl bg-accent/60 p-6 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white">
            <Play />
          </span>
          <h2 className="mt-4 text-2xl font-semibold">
            {ordinal ? selectedSections[0]?.title : "전체 실전"}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {total}문항 · {formatDuration(duration)}
          </p>
        </div>
        <PrimaryButton
          disabled={s.disabled || !bank || !consented}
          onClick={() => bank && void s.startCbt(bank.bankId, ordinal, quick)}
        >
          {s.busy ? "시험을 준비하는 중..." : "시험 시작"}
        </PrimaryButton>
      </FlowPage>
    );
  }
  if (attempt.state !== "IN_PROGRESS")
    return (
      <FlowPage
        rightSlot={<TutorialButton onClick={() => setTutorial(true)} />}
        title={attempt.state === "BREAK" ? "다음 교시 대기" : "응시 종료"}
        onBack={() => void leave()}
      >
        {feedback}
        <div className="rounded-2xl bg-accent/60 p-6 text-center">
          <Clock3 className="mx-auto h-10 w-10 text-primary" />
          <h1 className="mt-4 text-2xl font-bold">{attempt.title}</h1>
          <p className="mt-3 text-sm">
            {attempt.state === "BREAK"
              ? `다음 교시까지 ${formatDuration(s.remaining)}`
              : attempt.resultAvailable
                ? "학습 결과가 준비됐어요."
                : "결과 공개를 기다려주세요."}
          </p>
        </div>
        {attempt.state === "BREAK" && (
          <PrimaryButton
            disabled={s.disabled}
            onClick={() => void s.startNextSection()}
          >
            다음 교시 바로 시작
          </PrimaryButton>
        )}
        {attempt.resultAvailable && (
          <PrimaryButton
            disabled={s.disabled}
            onClick={() => void s.showResult()}
          >
            결과 확인
          </PrimaryButton>
        )}
        <button
          type="button"
          disabled={s.disabled}
          onClick={() => void leave()}
          className="mt-5 w-full py-3 text-sm text-muted-foreground"
        >
          CBT 허브로 돌아가기
        </button>
      </FlowPage>
    );
  return (
    <>
      <main className="h-dvh min-w-0 overflow-hidden bg-white text-foreground lg:min-h-[640px]">
        <header className="fixed inset-x-0 top-0 z-40 h-[calc(60px+env(safe-area-inset-top))] bg-white pt-[env(safe-area-inset-top)]">
          <div className="grid h-[60px] grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-2 px-3 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:px-5">
            <div className="flex min-w-0 items-center gap-2">
              <button
                type="button"
                aria-label="시험 나가기"
                onClick={() => setExitOpen(true)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#fafafa]"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div className="hidden min-w-0 min-[480px]:block">
                <p className="truncate text-sm font-extrabold">
                  {attempt.title}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {section?.title} · 현재 {s.index + 1}번
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setListOpen(true)}
                className="rounded-xl bg-[#fafafa] px-3 py-2 text-xs font-bold lg:hidden"
              >
                {s.index + 1}/{questions.length}
              </button>
              <div
                className="hidden rounded-xl bg-[#fafafa] p-1 lg:flex"
                role="group"
                aria-label="글자 크기"
              >
                {([80, 100, 125] as const).map((scale) => (
                  <button
                    key={scale}
                    type="button"
                    aria-pressed={fontScale === scale}
                    onClick={() => setFontScale(scale)}
                    className={`h-11 min-w-12 rounded-lg px-2 text-xs font-extrabold ${fontScale === scale ? "bg-foreground text-white" : ""}`}
                  >
                    {scale}%
                  </button>
                ))}
              </div>
              <div
                role="group"
                aria-label="문제 화면 배치"
                className="hidden rounded-xl bg-[#fafafa] p-1 min-[1180px]:flex"
              >
                {[false, true].map((value) => (
                  <button
                    key={String(value)}
                    type="button"
                    aria-pressed={double === value}
                    onClick={() => setDouble(value)}
                    className={`flex h-11 items-center gap-1 rounded-lg px-3 text-xs font-extrabold ${double === value ? "bg-foreground text-white" : ""}`}
                  >
                    <Columns2 className="h-4 w-4" />
                    {value ? "2문제" : "1문제"}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-end gap-1">
              <TutorialButton onClick={() => setTutorial(true)} />
              <div className="shrink-0 whitespace-nowrap rounded-xl bg-[#fafafa] px-3 py-2 text-right">
                <p className="text-[10px] font-bold text-muted-foreground">
                  남은 시간
                </p>
                <p className="mt-0.5 text-sm font-extrabold tabular-nums text-primary">
                  {formatDuration(s.remaining)}
                </p>
              </div>
            </div>
          </div>
        </header>
        <div className="fixed inset-x-0 bottom-[calc(120px+env(safe-area-inset-bottom))] top-[calc(60px+env(safe-area-inset-top))] grid grid-cols-1 lg:bottom-[calc(64px+env(safe-area-inset-bottom))] lg:grid-cols-[minmax(0,1fr)_280px] min-[1180px]:grid-cols-[minmax(0,1fr)_304px] min-[1280px]:grid-cols-[minmax(0,1fr)_320px]">
          <section className="flex min-w-0 flex-col overflow-hidden">
            {feedback}
            {s.remaining === 0 && (
              <p className="bg-amber-50 p-3 text-sm" role="status">
                시험이 종료됐어요. 제출 상태를 확인하고 있습니다.
              </p>
            )}
            <div
              className={
                double && width >= 1180
                  ? "grid min-h-0 flex-1 grid-cols-2 gap-3 overflow-hidden p-3"
                  : "min-h-0 flex-1 overflow-hidden"
              }
            >
              {displayed.map((q) => (
                <div
                  key={q.id}
                  className={`h-full min-w-0 overflow-y-auto ${double && width >= 1180 ? "p-1" : "p-3 sm:p-4 lg:p-6"}`}
                >
                  <QuestionPane
                    question={q}
                    answer={answers[q.id]}
                    active={q.id === attempt.currentQuestionId}
                    compact={double && width >= 1180}
                    locked={
                      locked ||
                      !!attempt.savedAnswers.find(
                        (a) => a.attemptQuestionId === q.id,
                      )?.finalized
                    }
                    fontScale={fontScale}
                    noteOpen={note === q.id}
                    onActivate={(id) => {
                      if (id !== attempt.currentQuestionId) go(id);
                    }}
                    onPatchAnswer={patch}
                    onToggleNote={(id) =>
                      setNote((previous) => (previous === id ? null : id))
                    }
                    onClearAnswer={(id) => patch(id, { selectedChoice: null })}
                  />
                </div>
              ))}
            </div>
          </section>
          <aside
            className="hidden min-h-0 flex-col overflow-hidden bg-[#fafafa] lg:flex"
            aria-label="답안 표기란"
          >
            <div className="flex h-16 shrink-0 items-center justify-between px-4">
              <div>
                <p className="text-xs font-bold text-primary">답안 표기란</p>
                <p className="mt-1 text-sm font-extrabold">
                  {summary.answered} / {summary.total} 응답
                </p>
              </div>
              <ListChecks className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-1">
              {questions.map((q) => (
                <div
                  key={q.id}
                  className={`mb-2 flex min-h-12 items-center rounded-xl px-1 py-0.5 ${q.id === attempt.currentQuestionId ? "bg-accent" : "hover:bg-white"}`}
                >
                  <button
                    type="button"
                    disabled={s.disabled}
                    onClick={() => go(q.id)}
                    aria-label={`${q.number}번 문제`}
                    className="relative flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-lg bg-white text-xs font-extrabold"
                  >
                    {q.number}
                    {answers[q.id].flagged && (
                      <Check className="absolute right-0 top-0 h-3 w-3" />
                    )}
                    <span className="flex gap-0.5">
                      {answers[q.id].unknown && (
                        <CircleHelp className="h-2.5 w-2.5 text-sky-700" />
                      )}
                      {answers[q.id].memo && (
                        <StickyNote className="h-2.5 w-2.5 text-amber-700" />
                      )}
                    </span>
                  </button>
                  <div className="ml-0.5 flex min-w-0 flex-1 flex-wrap justify-around">
                    {q.choices.map((_, choice) => (
                      <button
                        type="button"
                        key={choice}
                        disabled={locked}
                        aria-label={`${q.number}번 문항 ${choice + 1}번 선택지`}
                        aria-pressed={answers[q.id].selectedChoice === choice}
                        onClick={() => patch(q.id, { selectedChoice: choice })}
                        className={`flex h-11 w-11 items-center justify-center rounded-full text-xs font-extrabold ${answers[q.id].selectedChoice === choice ? "bg-primary text-white" : "bg-white"}`}
                      >
                        {choice + 1}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </aside>
        </div>
        <footer className="fixed inset-x-0 bottom-0 z-40 h-[calc(120px+env(safe-area-inset-bottom))] bg-white px-3 pb-[env(safe-area-inset-bottom)] lg:h-[calc(64px+env(safe-area-inset-bottom))] lg:px-4">
          <div className="flex h-[120px] flex-col justify-center gap-2 py-2 lg:hidden">
            <div className="grid grid-cols-[2.75rem_minmax(0,1fr)_auto_2.75rem] items-center gap-2">
              <button
                type="button"
                aria-label="이전 문제"
                disabled={s.disabled || s.index === 0}
                onClick={() => go(questions[s.index - 1].id)}
                className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#fafafa] disabled:opacity-40"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <span className="truncate text-center text-xs font-extrabold">
                현재 {s.index + 1} / {questions.length}
              </span>
              <button
                type="button"
                onClick={() => {
                  setListFilter("all");
                  setListOpen(true);
                }}
                className="h-11 rounded-xl bg-[#fafafa] px-3 text-xs font-bold"
              >
                문제 목록
              </button>
              <button
                type="button"
                aria-label="다음 문제"
                disabled={s.disabled || s.index >= questions.length - 1}
                onClick={() => go(questions[s.index + 1].id)}
                className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#fafafa] disabled:opacity-40"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
            <div className="grid grid-cols-[1fr_1.35fr] gap-2">
              <button
                type="button"
                onClick={() => setCalculator(true)}
                className="flex h-11 items-center justify-center gap-1 rounded-xl bg-[#fafafa] text-xs font-bold"
              >
                <Calculator className="h-4 w-4" />
                계산기
              </button>
              <button
                type="button"
                disabled={locked}
                onClick={() => setSubmitOpen(true)}
                className="h-11 rounded-xl bg-foreground px-3 text-xs font-extrabold text-white disabled:opacity-40"
              >
                답안 제출
              </button>
            </div>
          </div>
          <div className="hidden h-full items-center justify-between gap-2 py-2 lg:flex">
            <div className="flex gap-2">
              <NavButton
                label="이전"
                icon={<ChevronLeft className="h-4 w-4" />}
                disabled={s.disabled || s.index === 0}
                onClick={() => go(questions[s.index - 1].id)}
              />
              <NavButton
                label="다음"
                icon={<ChevronRight className="h-4 w-4" />}
                iconAfter
                disabled={s.disabled || s.index >= questions.length - 1}
                onClick={() => go(questions[s.index + 1].id)}
              />
            </div>
            <div className="flex gap-2">
              {(["all", "flagged", "unanswered"] as const).map((filter, i) => (
                <button
                  type="button"
                  key={filter}
                  onClick={() => {
                    setListFilter(filter);
                    setListOpen(true);
                  }}
                  className="rounded-xl bg-[#fafafa] px-3 py-3 text-xs font-bold"
                >
                  {["전체 문제", "체크", "안 푼 문제"][i]}{" "}
                  {[summary.total, summary.flagged, summary.unanswered][i]}
                </button>
              ))}
            </div>
            <div className="flex flex-1 items-center justify-end gap-2 lg:flex-none">
              <SaveStateBadge
                status={
                  s.error
                    ? "failed"
                    : s.busy || Object.keys(s.memos).length
                      ? "saving"
                      : "saved"
                }
              />
              <button
                type="button"
                onClick={() => setCalculator(true)}
                className="flex h-11 items-center gap-1 rounded-xl bg-[#fafafa] px-3 text-xs font-bold"
              >
                <Calculator className="h-4 w-4" />
                계산기
              </button>
              <button
                type="button"
                disabled={locked}
                onClick={() => setSubmitOpen(true)}
                className="h-11 rounded-xl bg-foreground px-4 text-xs font-extrabold text-white disabled:opacity-40"
              >
                답안 제출
              </button>
            </div>
          </div>
        </footer>
      </main>
      {listOpen && (
        <QuestionListDialog
          filter={listFilter}
          questions={filtered}
          allQuestions={questions}
          answers={answers}
          onFilter={setListFilter}
          onClose={() => setListOpen(false)}
          onSelect={(id) => {
            go(id);
            setListOpen(false);
          }}
        />
      )}
      {calculator && <CalculatorDialog onClose={() => setCalculator(false)} />}
      {submitOpen && (
        <SubmitDialog
          summary={summary}
          submitting={s.disabled}
          onClose={() => setSubmitOpen(false)}
          onShowUnanswered={() => {
            setSubmitOpen(false);
            setListFilter("unanswered");
            setListOpen(true);
          }}
          onSubmit={() =>
            void s.submitSection().then((ok) => {
              if (ok) setSubmitOpen(false);
            })
          }
        />
      )}
      {exitOpen && (
        <Dialog
          title="시험을 나갈까요?"
          description="저장한 답안은 이어서 풀 수 있어요. 시험 시간은 계속 흐릅니다."
          onClose={() => setExitOpen(false)}
        >
          <SecondaryButton onClick={() => setExitOpen(false)}>
            계속 풀기
          </SecondaryButton>
          <PrimaryButton disabled={s.disabled} onClick={() => void leave()}>
            저장하고 나가기
          </PrimaryButton>
        </Dialog>
      )}
    </>
  );
}
