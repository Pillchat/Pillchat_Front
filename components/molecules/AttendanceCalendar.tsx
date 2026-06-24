import { cn } from "@/lib/utils";

type DateValue = Date | string;

interface AttendanceCalendarProps {
  month?: DateValue;
  today?: DateValue;
  checkedDates?: DateValue[];
  className?: string;
}

const DAY_CELL_COUNT = 42;

function toLocalDate(value: DateValue) {
  if (value instanceof Date) {
    return new Date(value.getFullYear(), value.getMonth(), value.getDate());
  }

  const [year, month, date] = value.split("-").map(Number);
  return new Date(year, month - 1, date);
}

function toDateKey(value: DateValue) {
  const date = toLocalDate(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getMonthDates(month: Date) {
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const firstDate = new Date(year, monthIndex, 1);
  const lastDate = new Date(year, monthIndex + 1, 0);
  const leadingEmptyCount = firstDate.getDay();
  const dates: Array<Date | null> = Array.from(
    { length: leadingEmptyCount },
    () => null,
  );

  for (let date = 1; date <= lastDate.getDate(); date += 1) {
    dates.push(new Date(year, monthIndex, date));
  }

  while (dates.length < DAY_CELL_COUNT) {
    dates.push(null);
  }

  return dates;
}

export function AttendanceCalendar({
  month,
  today,
  checkedDates = [],
  className,
}: AttendanceCalendarProps) {
  const resolvedToday = today ? toLocalDate(today) : toLocalDate(new Date());
  const resolvedMonth = month ? toLocalDate(month) : resolvedToday;
  const todayKey = toDateKey(resolvedToday);
  const checkedDateSet = new Set(checkedDates.map(toDateKey));
  const dates = getMonthDates(resolvedMonth);

  return (
    <div
      className={cn("grid grid-cols-7 justify-items-center gap-y-3", className)}
    >
      {dates.map((date, index) => {
        if (!date) {
          return (
            <div
              key={`empty-${index}`}
              aria-hidden="true"
              className="h-10 w-10"
            />
          );
        }

        const dateKey = toDateKey(date);
        const isToday = dateKey === todayKey;
        const isChecked = checkedDateSet.has(dateKey);
        const attendanceLabel = isChecked ? "출석 완료" : "출석 전";

        return (
          <time
            key={dateKey}
            dateTime={dateKey}
            aria-label={`${date.getDate()}일 ${attendanceLabel}`}
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-full text-xl font-medium leading-none",
              isChecked && "bg-[#FFF1F0]",
              isChecked && isToday && "text-brand",
              isChecked && !isToday && "text-[#FF8F87]",
              !isChecked && isToday && "text-brand",
              !isChecked && !isToday && "text-[#B8B8B8]",
            )}
          >
            {date.getDate()}
          </time>
        );
      })}
    </div>
  );
}
