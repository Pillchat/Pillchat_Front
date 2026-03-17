"use client";

import type { ResolveModeType } from "@/types/questionbank";
import { FC } from "react";

interface ActionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMode: (mode: ResolveModeType) => void;
  totalCount: number;
  wrongCount: number;
  bookmarkedCount: number;
}

const ActionSheet: FC<ActionSheetProps> = ({
  isOpen,
  onClose,
  onSelectMode,
  totalCount,
  wrongCount,
  bookmarkedCount,
}) => {
  if (!isOpen) return null;

  const actions: { mode: ResolveModeType; label: string; count: number }[] = [
    { mode: "all", label: "전체 문제 다시 풀기", count: totalCount },
    { mode: "wrong", label: "오답 문제만 다시 풀기", count: wrongCount },
    {
      mode: "bookmarked",
      label: "북마크 문제만 다시 풀기",
      count: bookmarkedCount,
    },
  ];

  return (
    <>
      {/* 딤 처리 배경 */}
      <div className="fixed inset-0 z-40 bg-black/40" onClick={onClose} />

      {/* 바텀 시트 */}
      <div className="fixed bottom-0 left-0 right-0 z-50 mx-auto max-w-screen-sm animate-slide-up rounded-t-2xl bg-white px-6 pb-8 pt-4 shadow-lg">
        {/* 드래그 핸들 */}
        <div className="mb-4 flex justify-center">
          <div className="h-1 w-10 rounded-full bg-gray-300" />
        </div>

        <p className="mb-3 text-base font-semibold text-foreground">
          복습 방법 선택
        </p>

        <div className="flex flex-col gap-2">
          {actions.map(({ mode, label, count }) => (
            <button
              key={mode}
              className="flex items-center justify-between rounded-xl px-4 py-4 text-left transition-colors hover:bg-gray-50 active:bg-gray-100"
              onClick={() => {
                onSelectMode(mode);
                onClose();
              }}
              disabled={count === 0}
            >
              <div className="flex items-center gap-3">
                {/* 아이콘 */}
                {mode === "all" && (
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#FF412E"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="1 4 1 10 7 10" />
                    <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                  </svg>
                )}
                {mode === "wrong" && (
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#FF412E"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="15" y1="9" x2="9" y2="15" />
                    <line x1="9" y1="9" x2="15" y2="15" />
                  </svg>
                )}
                {mode === "bookmarked" && (
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="#FF412E"
                    stroke="#FF412E"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                  </svg>
                )}
                <span className="text-base font-medium">{label}</span>
              </div>
              <span className="text-sm text-muted-foreground">
                {count}문제
              </span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
};

export default ActionSheet;
