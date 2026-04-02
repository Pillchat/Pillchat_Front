"use client";

import { FC } from "react";
import type { ServerQuestion } from "@/types/questionbank";

interface ActionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMode: (mode: "all" | "wrong" | "bookmarked") => void;
  totalCount: number;
  wrongCount: number;
  questions?: ServerQuestion[];
  questionsLoading?: boolean;
}

const ActionSheet: FC<ActionSheetProps> = ({
  isOpen,
  onClose,
  onSelectMode,
  totalCount,
  wrongCount,
  questions,
  questionsLoading,
}) => {
  if (!isOpen) return null;

  const actions: {
    mode: "all" | "wrong" | "bookmarked";
    label: string;
    count?: number;
    icon: React.ReactNode;
  }[] = [
    {
      mode: "all",
      label: "전체 문제 복습",
      count: totalCount,
      icon: (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#3B82F6"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="1 4 1 10 7 10" />
          <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
        </svg>
      ),
    },
    {
      mode: "wrong",
      label: "오답 문제 복습",
      count: wrongCount,
      icon: (
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
      ),
    },
    {
      mode: "bookmarked",
      label: "북마크 문제 복습",
      icon: (
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
      ),
    },
  ];

  return (
    <>
      {/* 딤 처리 배경 */}
      <div className="fixed inset-0 z-40 bg-black/40" onClick={onClose} />

      {/* 바텀 시트 */}
      <div className="animate-slide-up fixed bottom-0 left-0 right-0 z-50 mx-auto max-w-screen-sm rounded-t-2xl bg-white px-6 pb-8 pt-4 shadow-lg md:max-w-none">
        {/* 드래그 핸들 */}
        <div className="mb-4 flex justify-center">
          <div className="h-1 w-10 rounded-full bg-gray-300" />
        </div>

        <p className="mb-3 text-base font-semibold text-foreground">
          복습 방법 선택
        </p>

        <div className="flex flex-col gap-2">
          {actions.map(({ mode, label, count, icon }) => (
            <button
              key={mode}
              className="flex items-center justify-between rounded-xl px-4 py-4 text-left transition-colors hover:bg-gray-50 active:bg-gray-100"
              onClick={() => {
                onSelectMode(mode);
                onClose();
              }}
              disabled={mode === "wrong" && wrongCount === 0}
            >
              <div className="flex items-center gap-3">
                {icon}
                <span className="text-base font-medium">{label}</span>
              </div>
              {count !== undefined && (
                <span className="text-sm text-muted-foreground">
                  {count}문제
                </span>
              )}
            </button>
          ))}
        </div>

        {/* 문제 목록 */}
        <div className="mt-4 border-t pt-4">
          <p className="mb-2 text-sm font-semibold text-foreground">
            문제 목록
          </p>
          {questionsLoading ? (
            <div className="flex items-center justify-center py-6">
              <span className="text-sm text-muted-foreground">
                문제 목록 불러오는 중...
              </span>
            </div>
          ) : questions && questions.length > 0 ? (
            <div className="max-h-60 overflow-y-auto">
              {questions.map((q, i) => (
                <div
                  key={q.id}
                  className="flex items-center gap-3 border-b py-3 last:border-b-0"
                >
                  <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {q.content}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      정답: {q.answer}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center py-4">
              <span className="text-sm text-muted-foreground">
                문제가 없습니다.
              </span>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ActionSheet;
