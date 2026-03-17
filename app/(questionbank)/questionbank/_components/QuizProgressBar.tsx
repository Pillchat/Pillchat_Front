"use client";

import { useAtomValue, useSetAtom } from "jotai";
import {
  progressLabelAtom,
  isCurrentBookmarkedAtom,
  currentQuestionAtom,
  toggleBookmarkAtom,
} from "@/store/quizSession";
import { FC, useState } from "react";
import { cn } from "@/lib/utils";

const QuizProgressBar: FC = () => {
  const progressLabel = useAtomValue(progressLabelAtom);
  const isBookmarked = useAtomValue(isCurrentBookmarkedAtom);
  const currentQuestion = useAtomValue(currentQuestionAtom);
  const toggleBookmark = useSetAtom(toggleBookmarkAtom);
  const [showHint, setShowHint] = useState(false);

  return (
    <div className="flex-shrink-0">
      {/* 진행도 + 액션 */}
      <div className="flex items-center justify-between px-6 py-3">
        <span className="text-sm font-semibold text-foreground">
          {progressLabel}
        </span>
        <div className="flex items-center gap-3">
          {/* 힌트 버튼 */}
          {currentQuestion?.hint && (
            <button
              onClick={() => setShowHint(!showHint)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                showHint
                  ? "bg-brand text-white"
                  : "bg-gray-100 text-muted-foreground",
              )}
            >
              힌트 보기
            </button>
          )}

          {/* 북마크 토글 */}
          <button onClick={() => toggleBookmark()}>
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill={isBookmarked ? "#FF412E" : "none"}
              stroke={isBookmarked ? "#FF412E" : "#999"}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
          </button>
        </div>
      </div>

      {/* 힌트 영역 */}
      {showHint && currentQuestion?.hint && (
        <div className="mx-6 mb-3 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {currentQuestion.hint}
        </div>
      )}
    </div>
  );
};

export default QuizProgressBar;
