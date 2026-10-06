"use client";

import { useState, type ReactNode } from "react";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { PracticeHeader } from "@/components/molecules";
import { SolidButton } from "@/components/atoms";

export function ReviewPlayerFrame({
  title,
  modeLabel,
  backHref,
  index,
  total,
  onPrevious,
  onBookmark,
  isBookmarked,
  hint,
  children,
  explanation,
  footer,
}: {
  title: string;
  modeLabel: string;
  backHref: string;
  index: number;
  total: number;
  onPrevious: () => void;
  onBookmark?: () => void;
  isBookmarked?: boolean;
  hint?: string | null;
  children: ReactNode;
  explanation?: ReactNode;
  footer: ReactNode;
}) {
  const [showHint, setShowHint] = useState(false);
  return (
    <div className="flex h-dvh flex-col bg-white">
      <PracticeHeader
        title="복습하기"
        subtitle={modeLabel}
        backHref={backHref}
      />
      <div className="shrink-0 px-6 pb-2 pt-4">
        <p className="truncate text-sm font-semibold">{title}</p>
        <div className="mt-3 flex items-center justify-between gap-2">
          <span className="shrink-0 text-sm font-semibold">
            문제 {index + 1}/{total}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={index === 0}
              onClick={onPrevious}
              className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white disabled:bg-gray-50 disabled:text-gray-300"
            >
              이전 문제
            </button>
            {hint && (
              <button
                type="button"
                onClick={() => setShowHint(!showHint)}
                className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium"
              >
                힌트 보기
              </button>
            )}
            {onBookmark && (
              <button
                type="button"
                aria-label={isBookmarked ? "북마크 해제" : "북마크"}
                aria-pressed={isBookmarked}
                onClick={onBookmark}
                className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-gray-50"
              >
                {isBookmarked ? (
                  <BookmarkCheck className="h-6 w-6 text-primary" />
                ) : (
                  <Bookmark className="h-6 w-6 text-gray-400" />
                )}
              </button>
            )}
          </div>
        </div>
        {showHint && hint && (
          <p className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
            {hint}
          </p>
        )}
      </div>
      <div className="flex-1 overflow-y-auto">
        <div className="px-6 py-4">{children}</div>
        {explanation}
      </div>
      <div className="shrink-0 border-t bg-white px-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-3">
        {footer}
      </div>
    </div>
  );
}

export function ReviewControls({
  graded,
  disabled,
  isLast,
  onReveal,
  onMain,
}: {
  graded: boolean;
  disabled: boolean;
  isLast: boolean;
  onReveal: () => void;
  onMain: () => void;
}) {
  return (
    <>
      {!graded && (
        <button
          type="button"
          onClick={onReveal}
          className="mb-3 w-full text-center text-sm text-muted-foreground underline"
        >
          잘 모르겠어요
        </button>
      )}
      <SolidButton
        content={graded ? (isLast ? "결과보기" : "다음 문제") : "채점하기"}
        disabled={disabled}
        variant={disabled ? "disabled" : "brand"}
        onClick={onMain}
      />
    </>
  );
}

export function ReviewExplanation({
  correct,
  correctAnswer,
  explanation,
  children,
}: {
  correct: boolean;
  correctAnswer: string;
  explanation: string;
  children?: ReactNode;
}) {
  return (
    <div aria-live="polite" className="border-t bg-white px-6 py-4">
      <div
        className={`mb-3 flex items-center gap-2 text-lg font-bold ${correct ? "text-green-500" : "text-red-500"}`}
      >
        <span
          className={`flex h-8 w-8 items-center justify-center rounded-full text-base text-white ${correct ? "bg-green-500" : "bg-red-500"}`}
        >
          {correct ? "O" : "X"}
        </span>
        <span>{correct ? "정답입니다!" : "오답입니다"}</span>
      </div>
      {!correct && (
        <p className="mb-2 text-sm font-medium">정답: {correctAnswer}</p>
      )}
      {explanation && (
        <div className="rounded-lg bg-gray-50 p-4">
          <p className="mb-1 text-xs font-semibold text-muted-foreground">
            해설
          </p>
          <p className="whitespace-pre-wrap text-sm leading-relaxed">
            {explanation}
          </p>
        </div>
      )}
      {children}
    </div>
  );
}
