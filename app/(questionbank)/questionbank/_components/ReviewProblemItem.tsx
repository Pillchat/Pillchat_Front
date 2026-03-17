"use client";

import { cn } from "@/lib/utils";
import type { ReviewProblemItemData } from "@/types/questionbank";
import { FC } from "react";

interface ReviewProblemItemProps {
  problem: ReviewProblemItemData;
  onClick?: () => void;
}

const ReviewProblemItem: FC<ReviewProblemItemProps> = ({
  problem,
  onClick,
}) => {
  return (
    <div
      className="flex cursor-pointer items-center gap-3 border-b px-6 py-4 active:bg-gray-50"
      onClick={onClick}
    >
      {/* 문제 번호 */}
      <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold">
        {problem.index + 1}
      </span>

      {/* 지문 미리보기 + 정답 */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">
          {problem.passagePreview}
        </p>
        <p className="mt-1 truncate text-xs text-muted-foreground">
          정답: {problem.answerPreview}
        </p>
      </div>

      {/* 북마크 + 채점 결과 */}
      <div className="flex items-center gap-2">
        {problem.isBookmarked && (
          <svg
            width="18"
            height="18"
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
        <span
          className={cn(
            "text-lg font-bold",
            problem.isCorrect ? "text-green-500" : "text-red-500",
          )}
        >
          {problem.isCorrect ? "O" : "X"}
        </span>
      </div>
    </div>
  );
};

export default ReviewProblemItem;
