"use client";

import { useEffect, useState } from "react";
import { CustomHeader } from "@/components/molecules";

const SELECTED_BADGE_STORAGE_KEY = "yakchat:selected-badge-id";

const temporaryBadges = [
  { id: "badge-1", name: "질문 마스터", icon: "/BadgeIcon1.svg" },
  { id: "badge-2", name: "자료 장인", icon: "/BadgeIcon2.svg" },
  { id: "badge-3", name: "오답 수집가", icon: "/BadgeIcon3.svg" },
  { id: "badge-4", name: "병원 실습 완료", icon: "/BadgeIcon4.svg" },
  { id: "badge-5", name: "국시패스", icon: "/BadgeIcon5.svg" },
];

export default function BadgeSettingPage() {
  const [selectedBadgeId, setSelectedBadgeId] = useState(temporaryBadges[0].id);
  const [pendingBadgeId, setPendingBadgeId] = useState(temporaryBadges[0].id);

  useEffect(() => {
    const savedBadgeId = window.localStorage.getItem(
      SELECTED_BADGE_STORAGE_KEY,
    );
    if (
      savedBadgeId &&
      temporaryBadges.some((badge) => badge.id === savedBadgeId)
    ) {
      setSelectedBadgeId(savedBadgeId);
      setPendingBadgeId(savedBadgeId);
    }
  }, []);

  const handleSave = () => {
    window.localStorage.setItem(SELECTED_BADGE_STORAGE_KEY, pendingBadgeId);
    setSelectedBadgeId(pendingBadgeId);
  };

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-screen-sm flex-col bg-white">
      <CustomHeader title="뱃지 설정" />

      <main className="flex-1 px-6 pb-32 pt-12">
        <div className="grid grid-cols-3 gap-x-4 gap-y-6">
          {temporaryBadges.map((badge) => {
            const isSelected = pendingBadgeId === badge.id;
            const isRepresented = selectedBadgeId === badge.id;

            return (
              <button
                key={badge.id}
                type="button"
                onClick={() => setPendingBadgeId(badge.id)}
                className="flex min-w-0 flex-col items-center text-center"
                aria-pressed={isSelected}
              >
                <span
                  className={`relative flex h-[4.25rem] w-[4.25rem] items-center justify-center rounded-full ${
                    isSelected
                      ? "ring-2 ring-brand ring-offset-2"
                      : "ring-1 ring-transparent"
                  }`}
                >
                  <img
                    src={badge.icon}
                    alt=""
                    className="h-[4.25rem] w-[4.25rem]"
                  />
                  {isRepresented && (
                    <span className="absolute -bottom-1 rounded-full bg-brand px-2 py-0.5 text-[0.625rem] font-semibold leading-none text-white">
                      대표
                    </span>
                  )}
                </span>
                <span className="mt-3 min-h-10 text-sm font-medium leading-5 text-[#333]">
                  {badge.name}
                </span>
              </button>
            );
          })}
        </div>
      </main>

      <div className="fixed bottom-0 left-1/2 w-full max-w-screen-sm -translate-x-1/2 bg-white px-6 pb-10 pt-3">
        <button
          type="button"
          onClick={handleSave}
          className="h-14 w-full rounded-2xl bg-brand text-lg font-semibold text-white"
        >
          이 뱃지로 설정하기
        </button>
      </div>
    </div>
  );
}
