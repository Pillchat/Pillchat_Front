"use client";

import { useAtomValue } from "jotai";
import { quizSessionAtom, currentQuestionAtom } from "@/store/quizSession";
import { cn } from "@/lib/utils";
import { FC } from "react";

const ExplanationPanel: FC = () => {
  const session = useAtomValue(quizSessionAtom);
  const question = useAtomValue(currentQuestionAtom);

  if (!session || !question || session.gradingState !== "graded") return null;

  const result = session.results[question.id];
  const isCorrect = result?.isCorrect ?? false;

  return (
    <div className="animate-slide-up flex-shrink-0 border-t bg-white px-6 py-4">
      {/* 정답/오답 표시 */}
      <div
        className={cn(
          "mb-3 flex items-center gap-2 text-lg font-bold",
          isCorrect ? "text-green-500" : "text-red-500",
        )}
      >
        <span
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-full text-base text-white",
            isCorrect ? "bg-green-500" : "bg-red-500",
          )}
        >
          {isCorrect ? "O" : "X"}
        </span>
        <span>{isCorrect ? "정답입니다!" : "오답입니다"}</span>
      </div>

      {/* 정답 안내 (오답일 때) */}
      {!isCorrect && result?.correctAnswer && (
        <p className="mb-2 text-sm font-medium text-foreground">
          정답: {result.correctAnswer}
        </p>
      )}

      {/* 해설 */}
      {(result?.explanation || question.explanation) && (
        <div className="rounded-lg bg-gray-50 p-4">
          <p className="mb-1 text-xs font-semibold text-muted-foreground">
            해설
          </p>
          <p className="text-sm leading-relaxed text-foreground">
            {result?.explanation || question.explanation}
          </p>
        </div>
      )}
    </div>
  );
};

export default ExplanationPanel;
