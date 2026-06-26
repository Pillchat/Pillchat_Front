const MS_PER_DAY = 24 * 60 * 60 * 1000;

const toDateInputValue = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0",
  )}-${String(date.getDate()).padStart(2, "0")}`;

const getJanuaryFourthFriday = (year: number) => {
  const date = new Date(year, 0, 1);
  const friday = 5;
  const daysUntilFirstFriday = (friday - date.getDay() + 7) % 7;

  date.setDate(1 + daysUntilFirstFriday + 21);
  return date;
};

export const getNextJanuaryFourthFridayDate = (reference = new Date()) => {
  let year = reference.getFullYear();
  let target = getJanuaryFourthFriday(year);

  if (
    target <
    new Date(reference.getFullYear(), reference.getMonth(), reference.getDate())
  ) {
    target = getJanuaryFourthFriday(year + 1);
  }

  return toDateInputValue(target);
};

export const calculateDday = (dateValue: string, reference = new Date()) => {
  const [year, month, day] = dateValue.split("-").map(Number);

  if (!year || !month || !day) return null;

  const today = Date.UTC(
    reference.getFullYear(),
    reference.getMonth(),
    reference.getDate(),
  );
  const target = Date.UTC(year, month - 1, day);

  return Math.ceil((target - today) / MS_PER_DAY);
};

export const formatDday = (days: number | null) => {
  if (days === null) return "\uBBF8\uC124\uC815";
  if (days === 0) return "D-Day";
  if (days > 0) return `D-${days}`;
  return `D+${Math.abs(days)}`;
};
