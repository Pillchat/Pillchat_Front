export const ATTENDANCE_STORAGE_KEY = "pillchat:attendance:v1";

export type AttendanceSnapshot = {
  days: number;
  completed: boolean;
};

// Use the device's calendar date, rather than the UTC date.
export const getAttendanceDate = (now = new Date()) =>
  `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

const isDateKey = (value: unknown): value is string => {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T12:00:00`);
  return !Number.isNaN(date.getTime()) && getAttendanceDate(date) === value;
};

const readDates = (): string[] => {
  if (typeof window === "undefined") return [];

  // Storage access errors must reach the caller so a failed save is not
  // presented as a successful check-in.
  const raw = window.localStorage.getItem(ATTENDANCE_STORAGE_KEY);
  if (!raw) return [];

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return [...new Set(parsed.filter(isDateKey))].sort();
  } catch {
    return [];
  }
};

const snapshot = (dates: string[], now: Date): AttendanceSnapshot => ({
  days: dates.length,
  completed: dates.includes(getAttendanceDate(now)),
});

export const readAttendance = (now = new Date()): AttendanceSnapshot =>
  snapshot(readDates(), now);

export const checkInAttendance = (now = new Date()): AttendanceSnapshot => {
  if (typeof window === "undefined") {
    throw new Error("Attendance requires browser storage");
  }

  // Read again at click time to include check-ins made in another tab.
  const dates = readDates();
  const today = getAttendanceDate(now);
  if (!dates.includes(today)) {
    dates.push(today);
    window.localStorage.setItem(
      ATTENDANCE_STORAGE_KEY,
      JSON.stringify(dates.sort()),
    );
  }

  return snapshot(dates, now);
};
