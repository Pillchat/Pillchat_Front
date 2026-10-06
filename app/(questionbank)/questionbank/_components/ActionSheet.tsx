"use client";

import { FC } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Bookmark, RotateCcw, CircleX, X } from "lucide-react";
import { REVIEW_MODE_LABELS, type ReviewMode } from "@/types/review";

interface ActionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMode: (mode: ReviewMode) => void;
  totalCount: number;
  wrongCount: number;
  unansweredCount?: number;
  allowBookmarks?: boolean;
  bookmarkedCount?: number;
  questions?: Array<{ id: string | number; content: string; answer?: string }>;
  questionsLoading?: boolean;
}

const ActionSheet: FC<ActionSheetProps> = ({
  isOpen,
  onClose,
  onSelectMode,
  totalCount,
  wrongCount,
  unansweredCount = 0,
  allowBookmarks = true,
  bookmarkedCount,
  questions,
  questionsLoading,
}) => {
  const actions = [
    { mode: "all" as const, count: totalCount, icon: RotateCcw },
    {
      mode: "wrong" as const,
      count: wrongCount + unansweredCount,
      icon: CircleX,
    },
    ...(allowBookmarks
      ? [
          {
            mode: "bookmarked" as const,
            count: bookmarkedCount,
            icon: Bookmark,
          },
        ]
      : []),
  ];
  return (
    <Dialog.Root
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/40" />
        <Dialog.Content className="fixed bottom-0 left-0 right-0 z-50 mx-auto max-h-[85dvh] max-w-app overflow-y-auto rounded-t-2xl bg-white px-6 pb-[calc(2rem+env(safe-area-inset-bottom))] pt-4 shadow-lg outline-none md:px-8">
          <div
            aria-hidden="true"
            className="mx-auto mb-4 h-1 w-10 rounded-full bg-gray-300"
          />
          <Dialog.Title className="mb-2 text-base font-semibold text-foreground">
            복습 방법 선택
          </Dialog.Title>
          <Dialog.Description className="mb-3 text-sm text-muted-foreground">
            다시 풀 문제의 범위를 선택해주세요.
          </Dialog.Description>
          <Dialog.Close
            aria-label="복습 방법 선택 닫기"
            className="absolute right-4 top-4 rounded-lg p-2 text-muted-foreground"
          >
            <X className="h-5 w-5" />
          </Dialog.Close>
          <div className="flex flex-col gap-2">
            {actions.map(({ mode, count, icon: Icon }) => (
              <button
                key={mode}
                type="button"
                disabled={count === 0 || questionsLoading}
                onClick={() => {
                  onSelectMode(mode);
                  onClose();
                }}
                className="flex items-center justify-between gap-3 rounded-xl px-4 py-4 text-left transition-colors hover:bg-gray-50 active:bg-gray-100 disabled:cursor-default disabled:opacity-40"
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`h-5 w-5 shrink-0 ${mode === "all" ? "text-blue-500" : "text-primary"}`}
                  />
                  <div>
                    <span className="text-base font-medium">
                      {REVIEW_MODE_LABELS[mode]}
                    </span>
                    {mode === "wrong" && unansweredCount > 0 && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        오답 {wrongCount} · 미응답 {unansweredCount}
                      </p>
                    )}
                  </div>
                </div>
                {count !== undefined && (
                  <span className="shrink-0 text-sm text-muted-foreground">
                    {count}문제
                  </span>
                )}
              </button>
            ))}
          </div>
          {(questions !== undefined || questionsLoading) && (
            <div className="mt-4 border-t pt-4">
              <p className="mb-2 text-sm font-semibold text-foreground">
                문제 목록
              </p>
              {questionsLoading ? (
                <p
                  role="status"
                  className="py-6 text-center text-sm text-muted-foreground"
                >
                  문제 목록 불러오는 중...
                </p>
              ) : questions?.length ? (
                <div className="max-h-60 overflow-y-auto">
                  {questions.map((question, index) => (
                    <div
                      key={question.id}
                      className="flex items-center gap-3 border-b py-3 last:border-b-0"
                    >
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                        {index + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {question.content}
                        </p>
                        {question.answer && (
                          <p className="mt-0.5 truncate text-xs text-muted-foreground">
                            정답: {question.answer}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  문제가 없습니다.
                </p>
              )}
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default ActionSheet;
