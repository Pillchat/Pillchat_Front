"use client";

import { useAtomValue, useSetAtom } from "jotai";
import {
  currentQuestionAtom,
  quizSessionAtom,
  setTextAnswerAtom,
} from "@/store/quizSession";
import { cn } from "@/lib/utils";
import { FC } from "react";

const FillInBlankInput: FC = () => {
  const session = useAtomValue(quizSessionAtom);
  const currentQuestion = useAtomValue(currentQuestionAtom);
  const setTextAnswer = useSetAtom(setTextAnswerAtom);

  if (!session || !currentQuestion) return null;

  const isGraded = session.gradingState === "graded";
  const result = session.results[currentQuestion.id];

  // content에서 ____를 기준으로 분할
  const parts = currentQuestion.passage.split(/_{4,}/);
  const blankCount = parts.length - 1;

  // 쉼표 구분으로 빈칸별 답안 파싱
  const answers = (session.textAnswer ?? "")
    .split(",")
    .concat(Array(blankCount).fill(""))
    .slice(0, Math.max(blankCount, 1));

  const handleBlankChange = (index: number, value: string) => {
    const updated = [...answers];
    updated[index] = value;
    setTextAnswer(updated.join(","));
  };

  // ____ 가 없는 경우 fallback (단순 텍스트 입력으로)
  if (blankCount < 1) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-base leading-relaxed text-foreground">
          {currentQuestion.passage}
        </p>
        <input
          type="text"
          value={answers[0] ?? ""}
          onChange={(e) => setTextAnswer(e.target.value)}
          disabled={isGraded}
          placeholder="빈칸에 들어갈 답을 입력하세요"
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
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-1 text-base leading-relaxed text-foreground">
        {parts.map((part, i) => (
          <span key={i} className="inline-flex items-center">
            <span>{part}</span>
            {i < blankCount && (
              <input
                type="text"
                value={answers[i] ?? ""}
                onChange={(e) => handleBlankChange(i, e.target.value)}
                disabled={isGraded}
                placeholder="____"
                className={cn(
                  "mx-1 inline-block w-32 border-b-2 bg-transparent px-1 py-0.5 text-center text-base outline-none transition-colors",
                  !isGraded && "border-gray-300 focus:border-brand",
                  isGraded && result?.isCorrect && "border-green-500 text-green-600",
                  isGraded && !result?.isCorrect && "border-red-500 text-red-600",
                )}
              />
            )}
          </span>
        ))}
      </div>
      {isGraded && !result?.isCorrect && result?.correctAnswer && (
        <p className="mt-2 text-sm text-green-600">
          정답: {result.correctAnswer}
        </p>
      )}
    </div>
  );
};

export default FillInBlankInput;
