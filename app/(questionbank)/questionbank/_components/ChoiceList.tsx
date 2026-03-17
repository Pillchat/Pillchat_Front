"use client";

import { useAtomValue, useSetAtom } from "jotai";
import {
  currentQuestionAtom,
  quizSessionAtom,
  selectChoiceAtom,
} from "@/store/quizSession";
import ChoiceItem from "./ChoiceItem";
import { FC } from "react";

const ChoiceList: FC = () => {
  const session = useAtomValue(quizSessionAtom);
  const currentQuestion = useAtomValue(currentQuestionAtom);
  const selectChoice = useSetAtom(selectChoiceAtom);

  if (!session || !currentQuestion) return null;

  return (
    <div className="flex flex-col gap-3">
      {currentQuestion.choices.map((choice) => (
        <ChoiceItem
          key={choice.id}
          choice={choice}
          isSelected={session.selectedChoiceId === choice.id}
          gradingState={session.gradingState}
          isCorrectChoice={session.gradingState === "graded" && choice.text === currentQuestion.correctAnswer}
          onClick={() => selectChoice(choice.id)}
        />
      ))}
    </div>
  );
};

export default ChoiceList;
