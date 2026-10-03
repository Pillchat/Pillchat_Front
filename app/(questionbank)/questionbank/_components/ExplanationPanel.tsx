"use client";

import { useAtomValue } from "jotai";
import { quizSessionAtom, currentQuestionAtom } from "@/store/quizSession";
import { ReviewExplanation } from "./ReviewPlayerFrame";
import { FC } from "react";

const ExplanationPanel: FC = () => {
  const session = useAtomValue(quizSessionAtom);
  const question = useAtomValue(currentQuestionAtom);

  if (!session || !question || session.gradingState !== "graded") return null;

  const result = session.results[question.id];
  const isCorrect = result?.isCorrect ?? false;

  return (
    <ReviewExplanation
      correct={isCorrect}
      correctAnswer={result?.correctAnswer ?? question.correctAnswer ?? ""}
      explanation={result?.explanation ?? question.explanation ?? ""}
    />
  );
};

export default ExplanationPanel;
