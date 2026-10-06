"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "@/lib/navigation";
import { useAtomValue, useSetAtom } from "jotai";
import { fetchAPI, ApiError } from "@/lib/client/fetch";
import {
  quizSessionAtom,
  currentQuestionAtom,
  applyGradeResultAtom,
  nextQuestionAtom,
  choiceIdToText,
  prevQuestionAtom,
  toggleBookmarkAtom,
  isCurrentBookmarkedAtom,
} from "@/store/quizSession";
import { CustomHeader } from "@/components/molecules";
import { SolidButton } from "@/components/atoms";
import QuizProgressBar from "../_components/QuizProgressBar";
import ChoiceList from "../_components/ChoiceList";
import TrueFalseButtons from "../_components/TrueFalseButtons";
import ShortAnswerInput from "../_components/ShortAnswerInput";
import FillInBlankInput from "../_components/FillInBlankInput";
import ExplanationPanel from "../_components/ExplanationPanel";
import {
  ReviewPlayerFrame,
  ReviewControls,
} from "../_components/ReviewPlayerFrame";
import { REVIEW_MODE_LABELS } from "@/types/review";
import type { SubmitAnswerResponse } from "@/types/questionbank";

const SolvePage = () => {
  const router = useRouter();
  const session = useAtomValue(quizSessionAtom);
  const currentQuestion = useAtomValue(currentQuestionAtom);
  const applyGrade = useSetAtom(applyGradeResultAtom);
  const nextAction = useSetAtom(nextQuestionAtom);
  const gradingRef = useRef(false);
  const [finishError, setFinishError] = useState(false);
  const [finishRetry, setFinishRetry] = useState(0);
  const pendingGrade = useRef<{ signature: string; key: string } | null>(null);
  const previousAction = useSetAtom(prevQuestionAtom);
  const bookmarkAction = useSetAtom(toggleBookmarkAtom);
  const isBookmarked = useAtomValue(isCurrentBookmarkedAtom);

  // 세션 없으면 진입 화면으로
  useEffect(() => {
    if (!session) {
      const saved = new URLSearchParams(window.location.search).get("session");
      router.replace(
        saved
          ? `/learning/ai?session=${encodeURIComponent(saved)}`
          : "/questionbank",
      );
    }
    if (session) {
      const url = new URL(window.location.href);
      url.searchParams.set("session", String(session.sessionId));
      window.history.replaceState(null, "", url);
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
        setFinishError(false);
        router.push("/questionbank/result");
      } catch {
        setFinishError(true);
      }
    };
    finishQuiz();
  }, [session?.isComplete, session?.sessionId, router, finishRetry]);

  if (finishError)
    return (
      <div className="p-6">
        <p role="alert">제출 결과를 확인하지 못했습니다.</p>
        <button
          onClick={() => {
            setFinishError(false);
            setFinishRetry((n) => n + 1);
          }}
        >
          종료 요청 다시 시도
        </button>
      </div>
    );

  if (!session || !currentQuestion) {
    return (
      <div className="flex h-dvh items-center justify-center">
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
  const handleGrade = async (action: "ANSWER" | "REVEAL" = "ANSWER") => {
    const userAnswerText = getUserAnswer();
    if ((action === "ANSWER" && !userAnswerText) || gradingRef.current) return;
    const signature = JSON.stringify({
      questionId: currentQuestion.id,
      action,
      userAnswerText: action === "ANSWER" ? userAnswerText : null,
    });
    if (pendingGrade.current && pendingGrade.current.signature !== signature) {
      alert("이전 답안과 같은 내용으로 재시도해주세요.");
      return;
    }
    pendingGrade.current ??= { signature, key: crypto.randomUUID() };
    gradingRef.current = true;

    try {
      const raw = await fetchAPI(
        `/api/questionbank/quiz/${session.sessionId}`,
        "POST",
        {
          action,
          idempotencyKey: pendingGrade.current.key,
          questionId: currentQuestion.id,
          ...(action === "ANSWER" ? { userAnswer: userAnswerText } : {}),
        },
      );
      const result: SubmitAnswerResponse = raw.data ?? raw;
      pendingGrade.current = null;

      applyGrade({
        questionId: result.questionId,
        isCorrect: result.isCorrect,
        correctAnswer: result.correctAnswer,
        explanation: result.explanation,
        userAnswer: result.userAnswer,
      });
    } catch (error) {
      if (error instanceof ApiError && error.status < 500)
        pendingGrade.current = null;
      alert(
        error instanceof Error
          ? error.message
          : "채점에 실패했습니다. 다시 시도해주세요.",
      );
    } finally {
      gradingRef.current = false;
    }
  };

  const handleRevealAnswer = () => {
    void handleGrade("REVEAL");
  };

  const handleMainButton = () => {
    if (gradingState === "graded") {
      nextAction();
    } else if (gradingState === "answered") {
      handleGrade();
    }
  };

  const isLastQuestion = session.currentIndex + 1 === session.questions.length;
  const mainButtonLabel =
    gradingState === "graded"
      ? isLastQuestion
        ? "결과보기"
        : "다음 문제"
      : "채점하기";
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

  if (session.reviewMode)
    return (
      <ReviewPlayerFrame
        key={currentQuestion.id}
        title={session.title}
        modeLabel={REVIEW_MODE_LABELS[session.reviewMode]}
        backHref="/questionbank/review?category=AI"
        index={session.currentIndex}
        total={session.questions.length}
        onPrevious={previousAction}
        onBookmark={bookmarkAction}
        isBookmarked={isBookmarked}
        hint={currentQuestion.hint}
        explanation={<ExplanationPanel />}
        footer={
          <ReviewControls
            graded={gradingState === "graded"}
            disabled={isMainDisabled}
            isLast={isLastQuestion}
            onReveal={handleRevealAnswer}
            onMain={handleMainButton}
          />
        }
      >
        {showPassage && (
          <p className="mb-6 text-base font-medium leading-relaxed text-foreground">
            {currentQuestion.passage}
          </p>
        )}
        {renderQuestionInput()}
      </ReviewPlayerFrame>
    );

  return (
    <div className="flex h-dvh select-none flex-col">
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

      <div className="flex-shrink-0 border-t bg-white px-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-3">
        {gradingState !== "graded" && (
          <button
            className="mb-3 w-full text-center text-sm text-muted-foreground underline"
            onClick={handleRevealAnswer}
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
