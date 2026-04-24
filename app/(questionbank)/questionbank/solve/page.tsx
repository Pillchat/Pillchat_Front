"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "@/lib/navigation";
import { useAtomValue, useSetAtom } from "jotai";
import { fetchAPI } from "@/lib/functions";
import {
  quizSessionAtom,
  currentQuestionAtom,
  applyGradeResultAtom,
  nextQuestionAtom,
  skipQuestionAtom,
  choiceIdToText,
} from "@/store/quizSession";
import { CustomHeader } from "@/components/molecules";
import { SolidButton } from "@/components/atoms";
import QuizProgressBar from "../_components/QuizProgressBar";
import ChoiceList from "../_components/ChoiceList";
import TrueFalseButtons from "../_components/TrueFalseButtons";
import ShortAnswerInput from "../_components/ShortAnswerInput";
import FillInBlankInput from "../_components/FillInBlankInput";
import ExplanationPanel from "../_components/ExplanationPanel";
import Watermark from "../_components/Watermark";
import type { SubmitAnswerResponse } from "@/types/questionbank";

const SolvePage = () => {
  const router = useRouter();
  const session = useAtomValue(quizSessionAtom);
  const currentQuestion = useAtomValue(currentQuestionAtom);
  const applyGrade = useSetAtom(applyGradeResultAtom);
  const nextAction = useSetAtom(nextQuestionAtom);
  const skipAction = useSetAtom(skipQuestionAtom);
  const gradingRef = useRef(false);

  // 세션 없으면 진입 화면으로
  useEffect(() => {
    if (!session) {
      router.replace("/questionbank");
    }
  }, [session, router]);

  // 모든 문제 완료 시 퀴즈 종료 API 호출 → 결과 페이지 이동
  useEffect(() => {
    if (!session?.isComplete) return;

    const finishQuiz = async () => {
      try {
        await fetchAPI(`/api/questionbank/quiz/${session.sessionId}`, "POST", {
          action: "finish",
        });
      } catch {
        // 종료 API 실패해도 결과 페이지로 이동
      }
      router.push("/questionbank/result");
    };
    finishQuiz();
  }, [session?.isComplete, session?.sessionId, router]);

  if (!session || !currentQuestion) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-muted-foreground">로딩 중...</div>
      </div>
    );
  }

  const { gradingState, selectedChoiceId, textAnswer } = session;
  const questionType = currentQuestion.questionType;

  /** 문제 유형별 userAnswer 추출 */
  const getUserAnswer = (): string | null => {
    switch (questionType) {
      case "MULTIPLE_CHOICE":
        return choiceIdToText(
          selectedChoiceId,
          currentQuestion.choices.map((c) => c.text),
        );
      case "TRUE_FALSE":
        return selectedChoiceId; // "O" or "X"
      case "SHORT_ANSWER":
      case "FILL_IN_BLANK":
        return textAnswer?.trim() || null;
      default:
        return null;
    }
  };

  /** 채점하기 — 서버에 답안 제출 */
  const handleGrade = async () => {
    const userAnswerText = getUserAnswer();
    if (!userAnswerText || gradingRef.current) return;
    gradingRef.current = true;

    try {
      const raw = await fetchAPI(
        `/api/questionbank/quiz/${session.sessionId}`,
        "POST",
        {
          action: "submit",
          questionId: currentQuestion.id,
          userAnswer: userAnswerText,
        },
      );
      const result: SubmitAnswerResponse = raw.data ?? raw;

      applyGrade({
        questionId: result.questionId,
        isCorrect: result.isCorrect,
        correctAnswer: result.correctAnswer,
        explanation: result.explanation,
        userAnswer: result.userAnswer,
      });
    } catch {
      alert("채점에 실패했습니다. 다시 시도해주세요.");
    } finally {
      gradingRef.current = false;
    }
  };

  const handleMainButton = () => {
    if (gradingState === "graded") {
      nextAction();
    } else if (gradingState === "answered") {
      handleGrade();
    }
  };

  const mainButtonLabel = gradingState === "graded" ? "다음 문제" : "채점하기";
  const isMainDisabled = gradingState === "unanswered";

  /** 문제 유형별 입력 컴포넌트 렌더링 */
  const renderQuestionInput = () => {
    switch (questionType) {
      case "MULTIPLE_CHOICE":
        return <ChoiceList />;
      case "TRUE_FALSE":
        return <TrueFalseButtons />;
      case "SHORT_ANSWER":
        return <ShortAnswerInput />;
      case "FILL_IN_BLANK":
        return <FillInBlankInput />;
      default:
        return <ChoiceList />;
    }
  };

  // FILL_IN_BLANK은 passage 안에 빈칸이 포함되어 있으므로 별도 표시 불필요
  const showPassage = questionType !== "FILL_IN_BLANK";

  return (
    <div className="flex h-screen select-none flex-col">
      <Watermark />
      <CustomHeader title={session.title} showIcon />
      <QuizProgressBar />

      <div className="flex-1 overflow-y-auto px-6 py-4">
        {showPassage && (
          <p className="mb-6 text-base font-medium leading-relaxed text-foreground">
            {currentQuestion.passage}
          </p>
        )}
        {renderQuestionInput()}
      </div>

      <ExplanationPanel />

      <div className="flex-shrink-0 border-t bg-white px-6 pb-6 pt-3">
        {gradingState !== "graded" && (
          <button
            className="mb-3 w-full text-center text-sm text-muted-foreground underline"
            onClick={() => skipAction()}
          >
            잘 모르겠어요
          </button>
        )}

        <SolidButton
          content={mainButtonLabel}
          disabled={isMainDisabled}
          variant={isMainDisabled ? "disabled" : "brand"}
          onClick={handleMainButton}
        />
      </div>
    </div>
  );
};

export default SolvePage;
