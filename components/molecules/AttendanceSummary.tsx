"use client";

import { Check } from "lucide-react";

interface AttendanceSummaryProps {
  days: number;
  completed: boolean;
  onCheckIn: () => void;
  pending?: boolean;
}

export function AttendanceSummary({
  days,
  completed,
  onCheckIn,
  pending = false,
}: AttendanceSummaryProps) {
  return (
    <section aria-label="출석 체크" className="mt-4 px-5 md:px-10">
      <div className="flex min-h-14 items-center justify-between gap-3 rounded-xl bg-gray-50 px-4 py-1.5">
        <p className="flex items-baseline gap-2 text-sm" aria-live="polite">
          <span className="text-muted-foreground">출석</span>
          <span className="font-semibold tabular-nums text-foreground">
            {days}일
          </span>
        </p>
        <button
          type="button"
          onClick={onCheckIn}
          disabled={completed || pending}
          aria-busy={pending}
          className="group flex min-h-11 shrink-0 items-center rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-default"
        >
          <span
            className={`flex h-8 items-center justify-center gap-1 rounded-lg px-3 text-xs font-semibold transition-colors ${
              completed
                ? "text-muted-foreground"
                : "bg-primary-980 text-primary group-enabled:hover:bg-primary/10"
            }`}
          >
            {completed && <Check aria-hidden="true" className="h-3.5 w-3.5" />}
            {pending ? "처리 중" : completed ? "출석 완료" : "출석하기"}
          </span>
        </button>
      </div>
    </section>
  );
}
