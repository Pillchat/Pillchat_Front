"use client";

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
  const checkedDates: string[] = [];
  const streakDays = 0;
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
            today={todayKey}
            checkedDates={checkedDates}
          />
        </section>

        <p className="mt-20 whitespace-pre-line text-center text-xl font-semibold leading-8 text-[#222]">
          {`${nickname} 님은\n현재 `}
          <span className="text-2xl text-primary">{streakDays}</span>
          {"일째 연속 출석 중이에요"}
        </p>

        <button
          type="button"
          className="mt-10 h-14 w-full rounded-2xl bg-primary text-base font-semibold text-white"
        >
          출석체크하고 5 팜머니 받기
        </button>
      </main>
    </div>
  );
}
