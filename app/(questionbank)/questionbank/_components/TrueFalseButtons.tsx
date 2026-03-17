"use client";

import { useAtomValue, useSetAtom } from "jotai";
import {
  currentQuestionAtom,
  quizSessionAtom,
  selectChoiceAtom,
} from "@/store/quizSession";
import { cn } from "@/lib/utils";
import { FC } from "react";

const OPTIONS = [
  { id: "O", label: "O" },
  { id: "X", label: "X" },
] as const;

const TrueFalseButtons: FC = () => {
  const session = useAtomValue(quizSessionAtom);
  const currentQuestion = useAtomValue(currentQuestionAtom);
  const selectChoice = useSetAtom(selectChoiceAtom);

  if (!session || !currentQuestion) return null;

  const isGraded = session.gradingState === "graded";
  const correctAnswer = currentQuestion.correctAnswer;

  return (
    <div className="flex justify-center gap-6">
      {OPTIONS.map((opt) => {
        const isSelected = session.selectedChoiceId === opt.id;
        const isCorrectOption = isGraded && correctAnswer === opt.id;
        const isWrongSelected = isGraded && isSelected && !isCorrectOption;

        return (
          <button
            key={opt.id}
            className={cn(
              "flex h-24 w-24 items-center justify-center rounded-full border-2 text-3xl font-bold transition-colors",
              // 채점 전
              !isGraded && isSelected && "border-brand bg-[#FFF6F5] text-brand",
              !isGraded && !isSelected && "border-gray-200 text-gray-400",
              // 채점 후 — 정답
              isCorrectOption && "border-green-500 bg-green-50 text-green-500",
              // 채점 후 — 오답으로 선택
              isWrongSelected && "border-red-500 bg-red-50 text-red-500",
              // 채점 후 — 선택하지 않은 오답
              isGraded && !isCorrectOption && !isSelected && "border-gray-100 text-gray-200 opacity-50",
            )}
            onClick={() => selectChoice(opt.id)}
            disabled={isGraded}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
};

export default TrueFalseButtons;
