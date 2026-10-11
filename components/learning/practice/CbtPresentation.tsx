"use client";
import { useState, type ReactNode } from "react";
import {
  ArrowLeft,
  Check,
  X,
  Table2,
  Flag,
  CircleHelp,
  StickyNote,
  RotateCcw,
  TriangleAlert,
  Save,
} from "lucide-react";
import { PillLoader } from "@/components/atoms/PillLoader";
import { LoadingIndicator } from "@/components/atoms/LoadingIndicator";
import { cn } from "@/lib/utils";
import type { CbtExamQuestion as SampleQuestion } from "@/types/cbt";
export type CbtDisplayQuestion = Omit<SampleQuestion, "subject" | "media"> & {
  subject: string;
  referenceContent?: string;
  practiceLabel?: string | null;
  media: (SampleQuestion["media"][number] & { url?: string })[];
};
type CbtExamQuestion = CbtDisplayQuestion;
export type ListFilter = "all" | "flagged" | "unanswered";
export type SaveStatus = "saved" | "saving" | "offline" | "failed";
export type AnswerState = {
  selectedChoice: number | null;
  flagged: boolean;
  unknown: boolean;
  memo: string;
  excludedChoices: number[];
  revision: number;
  updatedAt: string;
};

const emptyAnswer = (): AnswerState => ({
  selectedChoice: null,
  flagged: false,
  unknown: false,
  memo: "",
  excludedChoices: [],
  revision: 0,
  updatedAt: "",
});
type QuestionTypography = {
  meta: string;
  heading: string;
  badge: string;
  stem: string;
  auxiliaryLabel: string;
  auxiliaryBody: string;
  choiceNumber: string;
  choice: string;
  action: string;
  memo: string;
  counter: string;
};

const QUESTION_TYPOGRAPHY: Record<80 | 100 | 125, QuestionTypography> = {
  80: {
    meta: "text-xs",
    heading: "text-lg",
    badge: "text-[0.625rem]",
    stem: "text-[0.9375rem] leading-7",
    auxiliaryLabel: "text-[0.6875rem]",
    auxiliaryBody: "text-xs leading-5",
    choiceNumber: "text-xs",
    choice: "text-sm leading-6",
    action: "text-xs",
    memo: "text-xs",
    counter: "text-[0.6875rem]",
  },
  100: {
    meta: "text-sm",
    heading: "text-xl",
    badge: "text-[0.6875rem]",
    stem: "text-lg leading-8",
    auxiliaryLabel: "text-xs",
    auxiliaryBody: "text-sm leading-6",
    choiceNumber: "text-sm",
    choice: "text-base leading-7",
    action: "text-sm",
    memo: "text-sm",
    counter: "text-xs",
  },
  125: {
    meta: "text-base",
    heading: "text-2xl",
    badge: "text-xs",
    stem: "text-[1.375rem] leading-10",
    auxiliaryLabel: "text-sm",
    auxiliaryBody: "text-base leading-7",
    choiceNumber: "text-base",
    choice: "text-lg leading-8",
    action: "text-base",
    memo: "text-base",
    counter: "text-sm",
  },
};

export function FlowPage({
  title,
  onBack,
  children,
  rightSlot,
}: {
  title: string;
  onBack: () => void;
  children: ReactNode;
  rightSlot?: ReactNode;
}) {
  return (
    <main className="min-h-dvh bg-white px-4 pb-8 pt-[calc(2rem+env(safe-area-inset-top))] text-foreground sm:px-6">
      <div className="mx-auto max-w-[860px]">
        <header className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            aria-label="이전 화면"
            className="flex h-11 w-11 items-center justify-center rounded-xl transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-xl font-semibold text-primary sm:text-2xl">
            {title}
          </h1>
          {rightSlot && <div className="ml-auto">{rightSlot}</div>}
        </header>
        <section className="mt-6">{children}</section>
      </div>
    </main>
  );
}

export function QuestionPane({
  question,
  answer,
  active,
  compact,
  locked,
  fontScale,
  noteOpen,
  onActivate,
  onPatchAnswer,
  onToggleNote,
  onClearAnswer,
}: {
  question: CbtExamQuestion;
  answer: AnswerState;
  active: boolean;
  compact: boolean;
  locked: boolean;
  fontScale: 80 | 100 | 125;
  noteOpen: boolean;
  onActivate: (questionId: string) => void;
  onPatchAnswer: (
    questionId: string,
    patch: Partial<AnswerState>,
    delayMs?: number,
  ) => void;
  onToggleNote: (questionId: string) => void;
  onClearAnswer: (questionId: string) => void;
}) {
  const headingId = `cbt-question-${question.id}`;
  const typography = QUESTION_TYPOGRAPHY[fontScale];

  return (
    <article
      aria-labelledby={headingId}
      onClick={() => onActivate(question.id)}
      className={cn(
        "mx-auto min-w-0 rounded-2xl bg-white",
        compact ? "max-w-none p-4" : "max-w-[880px] p-6",
        active
          ? "border-2 border-primary"
          : "border-2 border-transparent bg-[#fafafa]",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p
            className={cn(
              "break-words font-bold text-primary",
              typography.meta,
            )}
          >
            {question.subject}
            {question.topic ? ` · ${question.topic}` : ""}
          </p>
          <div className="relative mt-3 inline-flex">
            {answer.flagged && (
              <span
                className="absolute -right-7 -top-4 flex h-6 w-6 items-center justify-center rounded-full bg-foreground text-white"
                aria-label={`${question.number}번 체크 문제`}
              >
                <Check className="h-4 w-4" strokeWidth={3} />
              </span>
            )}
            <h2
              id={headingId}
              className={cn("font-extrabold", typography.heading)}
            >
              {question.number}번 문항
            </h2>
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          {active && (
            <span
              className={cn(
                "rounded-full bg-primary-980 px-2 py-1 font-extrabold text-primary",
                typography.badge,
              )}
            >
              현재 문제
            </span>
          )}
          {question.practiceLabel !== null && (
            <span
              className={cn(
                "rounded-full bg-[#fafafa] px-2 py-1 font-bold",
                typography.badge,
              )}
            >
              {question.practiceLabel ?? "필챗 모의 문항"}
            </span>
          )}
        </div>
      </div>

      <p
        className={cn("mt-6 whitespace-pre-wrap break-words", typography.stem)}
      >
        {question.stem}
      </p>

      {question.referenceContent && (
        <p className="mt-4 whitespace-pre-wrap rounded-xl bg-sky-50 p-4">
          {question.referenceContent}
        </p>
      )}
      {question.type === "case" && !question.referenceContent && (
        <section className="mt-4 rounded-xl bg-sky-50 p-4">
          <p
            className={cn(
              "font-extrabold text-sky-800",
              typography.auxiliaryLabel,
            )}
          >
            사례형 문항
          </p>
          <p
            className={cn(
              "mt-1 font-medium text-sky-950",
              typography.auxiliaryBody,
            )}
          >
            동일한 환자 사례를 바탕으로 이어지는 문항입니다. 제시된 조건을
            유지해 답하세요.
          </p>
        </section>
      )}
      {(question.media ?? []).map((media) => (
        <section key={media.id} className="mt-4 rounded-xl bg-[#fafafa] p-4">
          <div
            className={cn(
              "flex items-center gap-2 font-extrabold",
              typography.auxiliaryLabel,
            )}
          >
            <Table2 className="h-4 w-4 text-primary" />
            {media.title}
          </div>
          {media.url && (
            <img
              src={media.url}
              alt={media.title || "문항 자료"}
              className="mt-3 max-w-full rounded-lg"
            />
          )}
          <p
            className={cn(
              "mt-2 text-muted-foreground",
              typography.auxiliaryBody,
            )}
          >
            {media.description}
          </p>
        </section>
      ))}

      <ol className="mt-6 space-y-3" data-cbt-tutorial="answer">
        {question.choices.map((choice, choiceIndex) => {
          const selected = answer.selectedChoice === choiceIndex;
          const excluded = answer.excludedChoices.includes(choiceIndex);
          return (
            <li
              key={`${question.id}-${choiceIndex}`}
              className="flex min-w-0 items-stretch gap-2"
            >
              <button
                type="button"
                disabled={locked}
                aria-pressed={selected}
                aria-label={`${choiceIndex + 1}번 선택지${selected ? ", 선택됨" : ""}`}
                onClick={() => {
                  onPatchAnswer(question.id, { selectedChoice: choiceIndex });
                }}
                className={cn(
                  "flex min-h-[56px] min-w-0 flex-1 items-center gap-3 rounded-xl px-4 py-3 text-left disabled:cursor-not-allowed",
                  selected
                    ? "bg-accent"
                    : excluded
                      ? "bg-gray-100 text-muted-foreground"
                      : "bg-[#fafafa] hover:bg-accent/50",
                )}
              >
                <span
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-extrabold",
                    typography.choiceNumber,
                    selected
                      ? "bg-primary text-white"
                      : "bg-white text-muted-foreground",
                  )}
                >
                  {choiceIndex + 1}
                </span>
                <span
                  className={cn(
                    "min-w-0 flex-1 break-words font-medium",
                    typography.choice,
                    excluded && "line-through decoration-2",
                  )}
                >
                  {choice}
                </span>
                {selected && (
                  <span
                    className={cn(
                      "shrink-0 font-extrabold text-primary",
                      typography.action,
                    )}
                  >
                    선택됨
                  </span>
                )}
              </button>
              <button
                type="button"
                disabled={locked || selected}
                aria-pressed={excluded}
                aria-label={`${choiceIndex + 1}번 선택지 ${excluded ? "제외 해제" : "제외"}`}
                title={selected ? "선택한 답은 제외할 수 없어요." : undefined}
                onClick={() =>
                  onPatchAnswer(question.id, {
                    excludedChoices: excluded
                      ? answer.excludedChoices.filter(
                          (value) => value !== choiceIndex,
                        )
                      : [...answer.excludedChoices, choiceIndex],
                  })
                }
                className={cn(
                  "min-h-[56px] w-14 shrink-0 rounded-xl font-extrabold disabled:cursor-not-allowed disabled:opacity-40",
                  typography.action,
                  excluded
                    ? "bg-red-50 text-destructive"
                    : "bg-[#fafafa] text-muted-foreground hover:bg-accent/50",
                )}
              >
                {excluded ? "복원" : "제외"}
              </button>
            </li>
          );
        })}
      </ol>

      <div className="mt-8 flex flex-wrap gap-2 pt-2">
        <ToolButton
          active={answer.flagged}
          tutorialTarget="check"
          icon={<Flag className="h-4 w-4" />}
          label="체크"
          textClassName={typography.action}
          disabled={locked}
          onClick={() => {
            onPatchAnswer(question.id, { flagged: !answer.flagged });
          }}
        />
        <ToolButton
          active={answer.unknown}
          tutorialTarget="unknown"
          icon={<CircleHelp className="h-4 w-4" />}
          label="모름"
          textClassName={typography.action}
          disabled={locked}
          onClick={() => {
            onPatchAnswer(question.id, { unknown: !answer.unknown });
          }}
        />
        <ToolButton
          active={noteOpen || answer.memo.trim().length > 0}
          tutorialTarget="memo"
          icon={<StickyNote className="h-4 w-4" />}
          label="메모"
          textClassName={typography.action}
          disabled={locked}
          onClick={() => onToggleNote(question.id)}
        />
        <ToolButton
          icon={<RotateCcw className="h-4 w-4" />}
          label="답 지우기"
          textClassName={typography.action}
          disabled={locked || answer.selectedChoice === null}
          onClick={() => onClearAnswer(question.id)}
        />
      </div>

      {noteOpen && (
        <div className="mt-4" data-cbt-tutorial="memo-input">
          <textarea
            value={answer.memo}
            maxLength={1000}
            rows={5}
            disabled={locked}
            onChange={(event) =>
              onPatchAnswer(question.id, { memo: event.target.value }, 500)
            }
            placeholder="풀이 과정과 확인할 내용을 메모하세요."
            className={cn(
              "w-full resize-none rounded-xl bg-[#fafafa] p-4 outline-none focus-visible:ring-2 focus-visible:ring-primary",
              typography.memo,
            )}
          />
          <p
            className={cn(
              "mt-1 text-right text-muted-foreground",
              typography.counter,
            )}
          >
            {answer.memo.length} / 1,000
          </p>
        </div>
      )}
    </article>
  );
}

export function ModeCard({
  icon,
  title,
  description,
  onClick,
  disabled = false,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-disabled={disabled}
      className="flex w-full items-center gap-4 py-3 text-left transition-transform active:scale-[0.98] disabled:cursor-default disabled:opacity-60"
    >
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent text-primary-600">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <strong className="block text-base font-semibold leading-6 text-foreground">
          {title}
        </strong>
        <span className="mt-1 block text-sm leading-5 text-muted-foreground">
          {description}
        </span>
      </span>
    </button>
  );
}
export function ChoiceCard({
  active,
  title,
  description,
  onClick,
}: {
  active: boolean;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "min-h-28 rounded-xl p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand",
        active ? "bg-accent text-primary" : "bg-accent/30 hover:bg-accent/50",
      )}
    >
      <strong className="block font-extrabold">{title}</strong>
      <span className="mt-1 block text-sm text-muted-foreground">
        {description}
      </span>
    </button>
  );
}
export function CheckRow({
  checked,
  title,
  description,
  readOnly,
  onChange,
}: {
  checked: boolean;
  title: string;
  description: string;
  readOnly?: boolean;
  onChange?: (checked: boolean) => void;
}) {
  return (
    <label
      className={cn(
        "mt-3 flex min-h-16 items-center gap-3 rounded-xl px-4 py-3",
        checked ? "bg-accent/60" : "bg-accent/30",
        readOnly ? "cursor-default" : "cursor-pointer",
      )}
    >
      <input
        type="checkbox"
        checked={checked}
        readOnly={readOnly}
        onChange={(event) => onChange?.(event.target.checked)}
        className="h-5 w-5 shrink-0 accent-primary"
      />
      <span>
        <strong className="block text-sm font-semibold">{title}</strong>
        <span className="mt-1 block text-xs text-muted-foreground">
          {description}
        </span>
      </span>
    </label>
  );
}
export function RotateNotice() {
  return (
    <div className="mb-4 flex items-center gap-3 rounded-xl bg-amber-50 p-4 text-amber-900">
      <RotateCcw className="h-5 w-5" />
      <div>
        <strong className="text-sm font-semibold">가로로 돌려 주세요</strong>
        <p className="mt-1 text-xs">
          화면을 돌려도 답안과 타이머는 유지됩니다.
        </p>
      </div>
    </div>
  );
}
export function InfoGrid({ items }: { items: Array<[string, string]> }) {
  return (
    <dl className="grid grid-cols-2 gap-4">
      {items.map(([label, value]) => (
        <div key={label} className="rounded-xl bg-accent/40 p-4">
          <dt className="text-xs font-semibold text-muted-foreground">
            {label}
          </dt>
          <dd className="mt-2 font-semibold">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
export function ToolButton({
  icon,
  label,
  active,
  disabled,
  textClassName,
  onClick,
  tutorialTarget,
}: {
  icon: ReactNode;
  label: string;
  active?: boolean;
  disabled?: boolean;
  textClassName?: string;
  onClick: () => void;
  tutorialTarget?: string;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      aria-pressed={active}
      data-cbt-tutorial={tutorialTarget}
      onClick={onClick}
      className={cn(
        "flex h-11 items-center gap-2 rounded-xl px-4 font-bold disabled:opacity-40",
        textClassName ?? "text-sm",
        active ? "bg-accent text-primary" : "bg-[#fafafa] hover:bg-accent/50",
      )}
    >
      {icon}
      {label}
    </button>
  );
}
export function NavButton({
  label,
  icon,
  iconAfter,
  disabled,
  onClick,
  tutorialTarget,
}: {
  label: string;
  icon: ReactNode;
  iconAfter?: boolean;
  disabled?: boolean;
  onClick: () => void;
  tutorialTarget?: string;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      data-cbt-tutorial={tutorialTarget}
      className="flex h-11 items-center gap-1 rounded-xl bg-[#fafafa] px-3 text-sm font-bold hover:bg-accent/50 disabled:opacity-40"
    >
      {!iconAfter && icon}
      {label}
      {iconAfter && icon}
    </button>
  );
}
export function FilterButton({
  label,
  count,
  accent,
  onClick,
}: {
  label: string;
  count: number;
  accent?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "h-11 rounded-xl px-3 text-xs font-bold",
        accent
          ? "bg-red-50 text-destructive"
          : "bg-[#fafafa] hover:bg-accent/50",
      )}
    >
      {label} {count}
    </button>
  );
}
export function SaveStateBadge({ status }: { status: SaveStatus }) {
  const labels: Record<SaveStatus, string> = {
    saved: "저장됨",
    saving: "저장 중",
    offline: "오프라인 저장됨",
    failed: "저장 실패",
  };
  return (
    <div
      role="status"
      className={cn(
        "flex h-11 items-center gap-2 rounded-xl px-3 text-xs font-bold",
        status === "failed"
          ? "bg-red-50 text-destructive"
          : "bg-[#fafafa] text-muted-foreground",
      )}
    >
      {status === "saving" ? (
        <PillLoader size={24} decorative />
      ) : (
        <Save className="h-4 w-4" />
      )}
      {labels[status]}
    </div>
  );
}

export function QuestionListDialog({
  filter,
  questions,
  allQuestions,
  answers,
  onFilter,
  onClose,
  onSelect,
}: {
  filter: ListFilter;
  questions: CbtExamQuestion[];
  allQuestions: CbtExamQuestion[];
  answers: Record<string, AnswerState>;
  onFilter: (filter: ListFilter) => void;
  onClose: () => void;
  onSelect: (questionId: string) => void;
}) {
  const counts = {
    all: allQuestions.length,
    flagged: allQuestions.filter((q) => answers[q.id]?.flagged).length,
    unanswered: allQuestions.filter(
      (q) => answers[q.id]?.selectedChoice == null,
    ).length,
  };
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-5"
      role="dialog"
      aria-modal="true"
      aria-label="문제 목록"
    >
      <section className="flex max-h-[80dvh] w-full max-w-[720px] flex-col overflow-hidden rounded-2xl bg-white">
        <header className="flex items-center justify-between p-5">
          <div>
            <p className="text-sm font-bold text-primary">문제 탐색</p>
            <h2 className="text-xl font-extrabold">문제 목록</h2>
          </div>
          <button
            type="button"
            aria-label="문제 목록 닫기"
            onClick={onClose}
            className="flex h-11 w-11 items-center justify-center rounded-xl hover:bg-accent/50"
          >
            <X className="h-5 w-5" />
          </button>
        </header>
        <div className="flex flex-wrap gap-2 px-5 pb-5">
          {(
            [
              ["all", "전체"],
              ["flagged", "체크"],
              ["unanswered", "안 푼 문제"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              aria-pressed={filter === key}
              onClick={() => onFilter(key)}
              className={cn(
                "h-11 rounded-xl px-4 text-sm font-bold",
                filter === key
                  ? "bg-accent text-primary"
                  : "bg-[#fafafa] hover:bg-accent/50",
              )}
            >
              {label} {counts[key]}
            </button>
          ))}
        </div>
        <div className="overflow-y-auto p-4">
          {questions.length === 0 ? (
            <p className="py-16 text-center text-sm font-bold text-muted-foreground">
              현재 조건에 맞는 문제가 없어요.
            </p>
          ) : (
            questions.map((question) => {
              const answer = answers[question.id] ?? emptyAnswer();
              return (
                <button
                  key={question.id}
                  type="button"
                  onClick={() => onSelect(question.id)}
                  className="mb-3 flex min-h-16 w-full items-center gap-3 rounded-xl bg-[#fafafa] p-3 text-left hover:bg-accent/50"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white font-extrabold">
                    {question.number}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="line-clamp-2 text-sm font-bold">
                      {question.stem}
                    </span>
                    <span className="mt-1 block text-xs text-muted-foreground">
                      선택 답{" "}
                      {answer.selectedChoice === null
                        ? "없음"
                        : `${answer.selectedChoice + 1}번`}
                    </span>
                  </span>
                  <span
                    className="flex gap-1"
                    aria-label={[
                      answer.flagged ? "체크" : "",
                      answer.unknown ? "모름" : "",
                      answer.memo.trim() ? "메모 있음" : "",
                    ]
                      .filter(Boolean)
                      .join(", ")}
                  >
                    {answer.flagged && (
                      <Flag className="h-4 w-4 text-primary" />
                    )}
                    {answer.unknown && (
                      <CircleHelp className="h-4 w-4 text-sky-700" />
                    )}
                    {answer.memo.trim() && (
                      <StickyNote className="h-4 w-4 text-amber-700" />
                    )}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}

export function SubmitDialog({
  summary,
  submitting,
  onClose,
  onShowUnanswered,
  onSubmit,
  tutorial = false,
}: {
  summary: {
    answered: number;
    unanswered: number;
    flagged: number;
    unknown: number;
  };
  submitting: boolean;
  onClose: () => void;
  onShowUnanswered: () => void;
  onSubmit: () => void;
  tutorial?: boolean;
}) {
  return (
    <Dialog
      title={tutorial ? "예제 답안을 확인해 보세요" : "답안을 제출할까요?"}
      tutorialTarget="submit-panel"
      description={
        tutorial
          ? "실전에서도 제출 전에 응답과 표시한 문제를 확인할 수 있어요."
          : summary.unanswered > 0
            ? `아직 풀지 않은 문제가 ${summary.unanswered}개 있어요.`
            : "모든 문제에 답했습니다. 제출 후에는 답을 수정할 수 없어요."
      }
      onClose={onClose}
    >
      <div className="grid grid-cols-4 gap-2">
        {[
          ["푼 문제", summary.answered],
          ["안 푼 문제", summary.unanswered],
          ["체크", summary.flagged],
          ["모름", summary.unknown],
        ].map(([label, value]) => (
          <ResultMetric
            key={String(label)}
            label={String(label)}
            value={Number(value)}
          />
        ))}
      </div>
      <div className="mt-5 grid gap-2">
        {!tutorial && summary.unanswered > 0 && (
          <SecondaryButton onClick={onShowUnanswered}>
            안 푼 문제 확인
          </SecondaryButton>
        )}
        <PrimaryButton compact disabled={submitting} onClick={onSubmit}>
          {tutorial ? (
            "튜토리얼 마치기"
          ) : submitting ? (
            <LoadingIndicator inline label="제출 중..." />
          ) : summary.unanswered > 0 ? (
            "그래도 제출"
          ) : (
            "답안 제출"
          )}
        </PrimaryButton>
        <button
          type="button"
          onClick={onClose}
          className="h-11 text-sm font-bold text-muted-foreground"
        >
          계속 풀기
        </button>
      </div>
    </Dialog>
  );
}

type CalculatorOperator = "+" | "−" | "×" | "÷";

export function CalculatorDialog({
  onClose,
  onCalculate,
}: {
  onClose: () => void;
  onCalculate?: () => void;
}) {
  const [display, setDisplay] = useState("0");
  const [accumulator, setAccumulator] = useState<number | null>(null);
  const [operator, setOperator] = useState<CalculatorOperator | null>(null);
  const [replaceDisplay, setReplaceDisplay] = useState(false);
  const [completedExpression, setCompletedExpression] = useState<string | null>(
    null,
  );

  const calculate = (left: number, right: number, op: CalculatorOperator) => {
    if (op === "+") return left + right;
    if (op === "−") return left - right;
    if (op === "×") return left * right;
    return right === 0 ? Number.NaN : left / right;
  };
  const formatValue = (value: number) =>
    Number.isFinite(value)
      ? Number(value.toPrecision(12)).toString().slice(0, 16)
      : "오류";
  const enterDigit = (digit: string) => {
    setCompletedExpression(null);
    if (display === "오류" || replaceDisplay) {
      setDisplay(digit === "." ? "0." : digit);
      setReplaceDisplay(false);
      return;
    }
    if (digit === "." && display.includes(".")) return;
    setDisplay((current) =>
      digit === "."
        ? `${current}.`
        : current === "0"
          ? digit
          : `${current}${digit}`.slice(0, 16),
    );
  };
  const chooseOperator = (nextOperator: CalculatorOperator) => {
    const value = Number(display);
    if (!Number.isFinite(value)) return;
    setCompletedExpression(null);
    if (accumulator !== null && operator && !replaceDisplay) {
      const next = calculate(accumulator, value, operator);
      setDisplay(formatValue(next));
      setAccumulator(Number.isFinite(next) ? next : null);
      if (!Number.isFinite(next)) {
        setCompletedExpression(
          `${formatValue(accumulator)} ${operator} ${display} = 오류`,
        );
        setOperator(null);
        setReplaceDisplay(true);
        return;
      }
    } else {
      setAccumulator(value);
    }
    setOperator(nextOperator);
    setReplaceDisplay(true);
  };
  const resolve = () => {
    if (accumulator === null || !operator) return;
    const next = calculate(accumulator, Number(display), operator);
    const result = formatValue(next);
    setCompletedExpression(
      `${formatValue(accumulator)} ${operator} ${display} = ${result}`,
    );
    setDisplay(result);
    setAccumulator(null);
    setOperator(null);
    setReplaceDisplay(true);
    onCalculate?.();
  };
  const clear = () => {
    setDisplay("0");
    setAccumulator(null);
    setOperator(null);
    setReplaceDisplay(false);
    setCompletedExpression(null);
  };
  const editDisplay = (edit: (value: string) => string) => {
    if (display === "오류") return;
    setCompletedExpression(null);
    setDisplay(edit(display));
    setReplaceDisplay(false);
  };
  const expression =
    completedExpression ??
    (accumulator !== null && operator
      ? `${formatValue(accumulator)} ${operator}${replaceDisplay ? "" : ` ${display}`}`
      : null);

  return (
    <Dialog
      title="시험용 계산기"
      tutorialTarget="calculator-panel"
      description="계산 결과는 답안에 자동으로 입력되지 않습니다."
      onClose={onClose}
    >
      <div className="mx-auto max-w-[360px]">
        <div
          role="status"
          aria-label={
            expression
              ? `계산식 ${expression}. 계산 값 ${display}`
              : `계산 값 ${display}`
          }
          className="mb-3 flex min-h-20 flex-col items-end justify-end gap-1 rounded-xl bg-accent/50 p-3 text-right sm:min-h-28 sm:gap-2 sm:p-4"
        >
          <p className="min-h-5 w-full break-all text-sm font-bold text-muted-foreground">
            {expression ?? "\u00a0"}
          </p>
          <p className="w-full break-all text-3xl font-extrabold tabular-nums text-primary">
            {display}
          </p>
        </div>
        <div className="grid grid-cols-4 gap-2">
          <CalculatorKey label="C" accent onClick={clear} />
          <CalculatorKey
            label="±"
            onClick={() =>
              editDisplay((current) =>
                current.startsWith("-")
                  ? current.slice(1)
                  : current === "0"
                    ? current
                    : `-${current}`,
              )
            }
          />
          <CalculatorKey
            label="%"
            onClick={() =>
              editDisplay((current) => formatValue(Number(current) / 100))
            }
          />
          <CalculatorKey label="÷" accent onClick={() => chooseOperator("÷")} />
          {["7", "8", "9"].map((digit) => (
            <CalculatorKey
              key={digit}
              label={digit}
              onClick={() => enterDigit(digit)}
            />
          ))}
          <CalculatorKey label="×" accent onClick={() => chooseOperator("×")} />
          {["4", "5", "6"].map((digit) => (
            <CalculatorKey
              key={digit}
              label={digit}
              onClick={() => enterDigit(digit)}
            />
          ))}
          <CalculatorKey label="−" accent onClick={() => chooseOperator("−")} />
          {["1", "2", "3"].map((digit) => (
            <CalculatorKey
              key={digit}
              label={digit}
              onClick={() => enterDigit(digit)}
            />
          ))}
          <CalculatorKey label="+" accent onClick={() => chooseOperator("+")} />
          <CalculatorKey
            label="⌫"
            onClick={() =>
              editDisplay((current) => {
                const next = current.slice(0, -1);
                return next === "" || next === "-" ? "0" : next;
              })
            }
          />
          <CalculatorKey label="0" onClick={() => enterDigit("0")} />
          <CalculatorKey label="." onClick={() => enterDigit(".")} />
          <CalculatorKey label="=" primary onClick={resolve} />
        </div>
      </div>
    </Dialog>
  );
}

export function CalculatorKey({
  label,
  accent,
  primary,
  onClick,
}: {
  label: string;
  accent?: boolean;
  primary?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "h-11 rounded-xl text-lg font-extrabold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand sm:h-14",
        primary
          ? "bg-primary text-white"
          : accent
            ? "bg-primary-980 text-primary"
            : "bg-accent/40",
      )}
    >
      {label}
    </button>
  );
}

export function Dialog({
  title,
  description,
  onClose,
  children,
  tutorialTarget,
}: {
  title: string;
  description: string;
  onClose: () => void;
  children: ReactNode;
  tutorialTarget?: string;
}) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-5"
      role="dialog"
      aria-modal="true"
    >
      <section
        data-cbt-tutorial={tutorialTarget}
        className="w-full max-w-[min(720px,80vw)] rounded-2xl bg-white p-5"
      >
        <header className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {description}
            </p>
          </div>
          <button
            type="button"
            aria-label="닫기"
            onClick={onClose}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
          >
            <X className="h-5 w-5" />
          </button>
        </header>
        <div className="mt-5">{children}</div>
      </section>
    </div>
  );
}
export function PrimaryButton({
  children,
  onClick,
  disabled,
  compact,
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  compact?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "w-full rounded-xl bg-primary font-extrabold text-white disabled:bg-gray-100 disabled:text-gray-500",
        compact ? "h-12" : "mt-6 h-14",
      )}
    >
      {children}
    </button>
  );
}
export function SecondaryButton({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="h-12 w-full rounded-xl bg-accent/50 text-sm font-extrabold transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
    >
      {children}
    </button>
  );
}
export function ResultMetric({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl bg-white/80 p-3 text-center">
      <strong className="text-xl font-extrabold">{value}</strong>
      <span className="mt-1 block text-xs text-muted-foreground">{label}</span>
    </div>
  );
}
export function CenteredMessage({
  title,
  description,
  actionLabel,
  onAction,
}: {
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-white p-5">
      <section className="w-full max-w-md p-6 text-center">
        <TriangleAlert className="mx-auto h-8 w-8 text-primary" />
        <h1 className="mt-4 text-xl font-extrabold">{title}</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {description}
        </p>
        <PrimaryButton onClick={onAction}>{actionLabel}</PrimaryButton>
      </section>
    </main>
  );
}
