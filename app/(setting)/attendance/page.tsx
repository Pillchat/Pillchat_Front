"use client";

import { useQuery } from "@tanstack/react-query";
import { useAttendance } from "@/hooks/useAttendance";
import { useAuthIdentity } from "@/hooks/useAuthIdentity";
import { readAttendanceCalendar } from "@/lib/client/attendance";
import { useEffect, useState } from "react";

import {
  AttendanceCalendar,
  AttendanceCalendarController,
  CustomHeader,
} from "@/components/molecules";

import { useMyProfile } from "../mypage/_hooks";

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export default function AttendancePage() {
  const { onMyProfile, profile } = useMyProfile();
  const [selectedMonth, setSelectedMonth] = useState(() => new Date());
  const today = new Date();
  const todayKey = toDateKey(today);
  const selectedMonthKey = toDateKey(selectedMonth);
  const userId = useAuthIdentity();
  const attendance = useAttendance();
  const month = selectedMonthKey.slice(0, 7);
  const calendar = useQuery({
    queryKey: ["attendance-calendar", userId, month],
    queryFn: () => readAttendanceCalendar(month),
    enabled: !!userId,
  });
  const [error, setError] = useState("");
  const checkedDates = calendar.data ?? [];
  const streakDays = attendance.data?.currentStreak;
  const nickname = profile.nickname || "닉네임";

  useEffect(() => {
    onMyProfile();
  }, [onMyProfile]);

  return (
    <div className="mx-auto min-h-dvh w-full max-w-screen-sm bg-white">
      <CustomHeader title="출석체크" />

      <main className="px-6 pb-10">
        <section className="mt-[52px]">
          <AttendanceCalendarController
            value={selectedMonth}
            onChange={setSelectedMonth}
            className="mb-5"
          />
          <AttendanceCalendar
            month={selectedMonthKey}
            today={attendance.data?.date ?? todayKey}
            checkedDates={checkedDates}
          />
        </section>

        <p className="mt-20 whitespace-pre-line text-center text-xl font-semibold leading-8 text-[#222]">
          {`${nickname} 님은\n현재 `}
          <span className="text-2xl text-primary">{streakDays ?? "–"}</span>
          {"일째 연속 출석 중이에요"}
        </p>

        <button
          type="button"
          disabled={
            attendance.isLoading ||
            attendance.isCheckingIn ||
            attendance.data?.todayChecked
          }
          onClick={() => {
            setError("");
            void attendance
              .checkIn()
              .catch(() =>
                setError("출석을 저장하지 못했어요. 다시 시도해 주세요."),
              );
          }}
          className="mt-10 h-14 w-full rounded-2xl bg-primary text-base font-semibold text-white disabled:opacity-50"
        >
          {attendance.isCheckingIn
            ? "출석 처리 중"
            : attendance.data?.todayChecked
              ? "오늘 출석 완료"
              : "출석하기"}
        </button>
        {(error || attendance.isError || calendar.isError) && (
          <p role="alert" className="mt-3 text-sm text-destructive">
            {error || "출석 정보를 불러오지 못했어요."}
            <button
              className="ml-2 underline"
              onClick={() => {
                void attendance.refetch();
                void calendar.refetch();
              }}
            >
              다시 불러오기
            </button>
          </p>
        )}
      </main>
    </div>
  );
}
