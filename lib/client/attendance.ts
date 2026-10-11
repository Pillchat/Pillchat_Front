import { fetchAPI } from "@/lib/client/fetch";

export type AttendanceSnapshot = {
  date: string;
  timezone: string;
  todayChecked: boolean;
  totalDays: number;
  currentStreak: number;
  longestStreak: number;
  grade: string;
  gradeCode?: string;
};

// The server owns the attendance date, counts, and earned grade.
export const readAttendance = (): Promise<AttendanceSnapshot> =>
  fetchAPI("/api/attendance", "GET");

export const checkInAttendance = (): Promise<AttendanceSnapshot> =>
  fetchAPI("/api/attendance/check-ins", "POST");

export const readAttendanceCalendar = (month: string): Promise<string[]> =>
  fetchAPI("/api/attendance/calendar", "GET", { month });
