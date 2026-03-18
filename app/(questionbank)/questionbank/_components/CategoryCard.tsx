"use client";

import { FC } from "react";
import type { ReviewCategoryItem } from "@/types/questionbank";

interface CategoryCardProps {
  item: ReviewCategoryItem;
  onClick: () => void;
}

const CategoryCard: FC<CategoryCardProps> = ({ item, onClick }) => {
  return (
    <div
      className="flex cursor-pointer items-center justify-between border-b px-6 py-4 active:bg-gray-50"
      onClick={onClick}
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-base font-semibold text-foreground">
          {item.title}
        </p>
        <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
          <span>{item.subject}</span>
          <span>·</span>
          <span>총 {item.totalQuestionCount}문제</span>
          <span>·</span>
          <span className="font-medium text-red-500">
            오답 {item.wrongCount}
          </span>
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
    </div>
  );
};

export default CategoryCard;
