"use client";

import { FC } from "react";
import type { ReviewCategoryItem } from "@/types/questionbank";

interface CategoryCardProps {
  item: Pick<
    ReviewCategoryItem,
    "title" | "subject" | "totalQuestionCount" | "wrongCount"
  >;
  onClick: () => void;
  unansweredCount?: number;
  dateLabel?: string;
}

const CategoryCard: FC<CategoryCardProps> = ({
  item,
  onClick,
  unansweredCount = 0,
  dateLabel,
}) => {
  return (
    <button
      type="button"
      className="flex w-full items-center justify-between gap-3 border-b px-6 py-4 text-left hover:bg-gray-50 active:bg-gray-100"
      onClick={onClick}
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-base font-semibold text-foreground">
          {item.title}
        </p>
        {dateLabel && (
          <p className="mt-1 text-xs text-muted-foreground">{dateLabel}</p>
        )}
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
          <span>{item.subject}</span>
          <span>·</span>
          <span>총 {item.totalQuestionCount}문제</span>
          <span>·</span>
          <span className="font-medium text-red-500">
            오답 {item.wrongCount}
          </span>
          {unansweredCount > 0 && <span>미응답 {unansweredCount}</span>}
        </div>
      </div>
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#9ca3af"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="flex-shrink-0"
      >
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </button>
  );
};

export default CategoryCard;
