"use client";

import { useAtomValue, useSetAtom } from "jotai";
import {
  currentQuestionAtom,
  quizSessionAtom,
  setTextAnswerAtom,
} from "@/store/quizSession";
import { cn } from "@/lib/utils";
import { FC } from "react";

const ShortAnswerInput: FC = () => {
  const session = useAtomValue(quizSessionAtom);
  const currentQuestion = useAtomValue(currentQuestionAtom);
  const setTextAnswer = useSetAtom(setTextAnswerAtom);

  if (!session || !currentQuestion) return null;

  const isGraded = session.gradingState === "graded";
  const result = session.results[currentQuestion.id];

  return (
    <div className="flex flex-col gap-3">
      <input
        type="text"
        value={session.textAnswer ?? ""}
        onChange={(e) => setTextAnswer(e.target.value)}
        disabled={isGraded}
        placeholder="답을 입력하세요"
        className={cn(
          "w-full rounded-xl border px-4 py-3 text-base outline-none transition-colors",
          !isGraded && "border-gray-200 focus:border-brand",
          isGraded && result?.isCorrect && "border-green-500 bg-green-50",
          isGraded && !result?.isCorrect && "border-red-500 bg-red-50",
        )}
      />
      {isGraded && !result?.isCorrect && result?.correctAnswer && (
        <p className="text-sm text-green-600">
          정답: {result.correctAnswer}
        </p>
      )}
    </div>
  );
};

export default ShortAnswerInput;
