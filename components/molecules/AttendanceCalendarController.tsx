import { PUBLIC_ASSETS } from "@/constants/assets";
import { cn } from "@/lib/utils";

interface AttendanceCalendarControllerProps {
  value: Date;
  onChange: (date: Date) => void;
  className?: string;
}

const MONTH_OPTIONS = Array.from({ length: 12 }, (_, index) => index + 1);

function getYearOptions(currentYear: number) {
  return Array.from({ length: 11 }, (_, index) => currentYear - 5 + index);
}

function moveMonth(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

function SelectChevron() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      className="h-4 w-4 text-[#111]"
      fill="none"
    >
      <path
        d="M4 6L8 10L12 6"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function AttendanceCalendarController({
  value,
  onChange,
  className,
}: AttendanceCalendarControllerProps) {
  const selectedYear = value.getFullYear();
  const selectedMonth = value.getMonth() + 1;
  const yearOptions = getYearOptions(selectedYear);

  return (
    <div
      className={cn(
        "mx-auto flex w-full max-w-[288px] items-center justify-between",
        className,
      )}
    >
      <button
        type="button"
        onClick={() => onChange(moveMonth(value, -1))}
        className="flex h-8 w-8 items-center justify-start"
        aria-label="이전 달"
      >
        <img
          src={PUBLIC_ASSETS.icons.chevronLeft}
          alt=""
          className="h-6 w-6 opacity-70"
        />
      </button>

      <div className="flex items-center gap-2">
        <label className="relative flex h-11 w-[104px] items-center rounded-full border border-[#c4c4c4] bg-white">
          <span className="sr-only">연도 선택</span>
          <select
            value={selectedYear}
            onChange={(event) =>
              onChange(
                new Date(Number(event.target.value), value.getMonth(), 1),
              )
            }
            className="h-full w-full appearance-none rounded-full bg-transparent py-0 pl-4 pr-9 text-sm font-medium text-[#111] outline-none"
          >
            {yearOptions.map((year) => (
              <option key={year} value={year}>
                {year}년
              </option>
            ))}
          </select>
          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2">
            <SelectChevron />
          </span>
        </label>

        <label className="relative flex h-11 w-20 items-center rounded-full border border-[#c4c4c4] bg-white">
          <span className="sr-only">월 선택</span>
          <select
            value={selectedMonth}
            onChange={(event) =>
              onChange(
                new Date(
                  value.getFullYear(),
                  Number(event.target.value) - 1,
                  1,
                ),
              )
            }
            className="h-full w-full appearance-none rounded-full bg-transparent py-0 pl-4 pr-8 text-sm font-medium text-[#111] outline-none"
          >
            {MONTH_OPTIONS.map((month) => (
              <option key={month} value={month}>
                {month}월
              </option>
            ))}
          </select>
          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2">
            <SelectChevron />
          </span>
        </label>
      </div>

      <button
        type="button"
        onClick={() => onChange(moveMonth(value, 1))}
        className="flex h-8 w-8 items-center justify-end"
        aria-label="다음 달"
      >
        <img
          src={PUBLIC_ASSETS.icons.chevronLeft}
          alt=""
          className="h-6 w-6 rotate-180 opacity-70"
        />
      </button>
    </div>
  );
}
