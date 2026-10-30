import type { LearningWeek } from "@/lib/learning/dashboard";
import StatsCard from "@/app/(questionbank)/questionbank/_components/StatsCard";

const weekdays = ["월", "화", "수", "목", "금", "토", "일"];

export default function HomeWeeklyReport({
  weekly,
  pending,
  isError,
}: {
  weekly?: LearningWeek;
  pending: boolean;
  isError: boolean;
}) {
  const maximum = Math.max(
    1,
    ...(weekly?.days.map((day) => day.solvedCount) ?? []),
  );
  return (
    <section aria-labelledby="weekly-report-title" aria-busy={pending}>
      <h2 id="weekly-report-title" className="text-headline-small">
        주간 리포트
      </h2>
      {weekly ? (
        <div className="mt-3 rounded-xl border border-border p-4">
          <p className="text-body-small text-muted-foreground">
            {weekly.weekStart.replaceAll("-", ".")}부터 · 월요일~일요일
          </p>
          <ul
            className="mt-4 grid grid-cols-7 gap-2"
            aria-label="요일별 학습 문제 수"
          >
            {weekly.days.map((day, index) => (
              <li
                key={day.date}
                className="min-w-0 text-center"
                aria-label={`${day.date} ${weekdays[index]}요일 ${day.solvedCount}문제`}
              >
                <div
                  aria-hidden="true"
                  className="flex h-32 flex-col items-center justify-end gap-1"
                >
                  <span className="text-label-small tabular-nums">
                    {day.solvedCount}
                  </span>
                  <div
                    className="w-full max-w-8 rounded-t bg-primary"
                    style={{ height: `${(day.solvedCount / maximum) * 90}px` }}
                  />
                </div>
                <span
                  aria-hidden="true"
                  className="mt-2 block text-body-small text-muted-foreground"
                >
                  {weekdays[index]}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex gap-2">
            <StatsCard
              label="주간 학습 문제"
              value={`${weekly.solvedCount}문제`}
            />
            <StatsCard
              label="주간 정답률"
              value={`${weekly.solvedCount ? Math.round((weekly.correctCount / weekly.solvedCount) * 100) : 0}%`}
            />
          </div>
          {weekly.solvedCount === 0 && (
            <p className="mt-3 text-center text-body-medium text-muted-foreground">
              이번 주 첫 문제를 풀어보세요.
            </p>
          )}
        </div>
      ) : (
        <p className="mt-3 rounded-xl bg-gray-50 p-4 text-body-medium text-muted-foreground">
          {pending
            ? "이번 주 학습 기록을 불러오는 중이에요."
            : isError
              ? "주간 학습 기록을 확인하지 못했어요."
              : "주간 학습 기록을 준비하고 있어요."}
        </p>
      )}
    </section>
  );
}
