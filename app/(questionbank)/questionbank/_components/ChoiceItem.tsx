"use client";

import { cn } from "@/lib/utils";
import type { Choice, GradingState } from "@/types/questionbank";
import { FC } from "react";

interface ChoiceItemProps {
  choice: Choice;
  isSelected: boolean;
  gradingState: GradingState;
  /** 이 선지가 정답인지 (채점 후 표시용) */
  isCorrectChoice?: boolean;
  onClick: () => void;
}

const ChoiceItem: FC<ChoiceItemProps> = ({
  choice,
  isSelected,
  gradingState,
  isCorrectChoice,
  onClick,
}) => {
  const isGraded = gradingState === "graded";

  return (
    <button
      className={cn(
        "flex w-full items-center gap-3 rounded-xl border p-4 text-left transition-colors",
        // 채점 전
        !isGraded && isSelected && "border-2 border-brand bg-[#FFF6F5]",
        !isGraded && !isSelected && "border-gray-200",
        // 채점 후 — 정답 선지
        isGraded && isCorrectChoice && "border-2 border-green-500 bg-green-50",
        // 채점 후 — 오답으로 선택한 선지
        isGraded &&
          !isCorrectChoice &&
          isSelected &&
          "border-2 border-red-500 bg-red-50",
        // 채점 후 — 선택하지 않은 오답 선지
        isGraded &&
          !isCorrectChoice &&
          !isSelected &&
          "border-gray-100 opacity-50",
      )}
      onClick={onClick}
      disabled={isGraded}
    >
      {/* 선지 번호 (A, B, C...) */}
      <span
        className={cn(
          "flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border text-sm font-semibold",
          !isGraded && isSelected && "border-brand text-brand",
          isGraded &&
            isCorrectChoice &&
            "border-green-500 bg-green-500 text-white",
          isGraded &&
            !isCorrectChoice &&
            isSelected &&
            "border-red-500 bg-red-500 text-white",
        )}
      >
        {choice.id}
      </span>

      {/* 선지 텍스트 */}
      <span className="flex-1 text-sm leading-relaxed">{choice.text}</span>

      {/* 채점 결과 아이콘 */}
      {isGraded && isCorrectChoice && (
        <span className="text-lg font-bold text-green-500">O</span>
      )}
      {isGraded && !isCorrectChoice && isSelected && (
        <span className="text-lg font-bold text-red-500">X</span>
      )}
    </button>
  );
};

export default ChoiceItem;
