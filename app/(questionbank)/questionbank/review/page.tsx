"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSetAtom } from "jotai";
import { fetchAPI } from "@/lib/functions";
import { initQuizSessionAtom, mapChoices } from "@/store/quizSession";
import { CustomHeader, TabsWithUnderline } from "@/components/molecules";
import { FloatingActionButton } from "@/components/atoms";
import ReviewProblemItem from "../_components/ReviewProblemItem";
import ActionSheet from "../_components/ActionSheet";
import LoadingOverlay from "../_components/LoadingOverlay";
import type {
  ReviewQuestionResponse,
  ReviewProblemItemData,
  ResolveModeType,
  QuizStartResponse,
} from "@/types/questionbank";

const TABS = [
  { value: "PDF", label: "강의자료 문제" },
  { value: "PREMIUM", label: "수제 제작 문제" },
];

const ReviewListPage = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("PDF");
  const [questions, setQuestions] = useState<ReviewQuestionResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showActionSheet, setShowActionSheet] = useState(false);
  const initSession = useSetAtom(initQuizSessionAtom);

  const fetchQuestions = useCallback(async (source: string) => {
    setLoading(true);
    try {
      const raw = await fetchAPI("/api/questionbank/review", "GET", { source });
      const data: ReviewQuestionResponse[] = raw.data ?? raw;
      setQuestions(Array.isArray(data) ? data : []);
    } catch {
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQuestions(activeTab);
  }, [activeTab, fetchQuestions]);

  // ReviewQuestionResponse → ReviewProblemItemData 변환
  const problems: ReviewProblemItemData[] = questions.map((q, i) => ({
    questionId: q.questionId,
    index: i,
    passagePreview: q.content,
    answerPreview: q.answer,
    isCorrect: q.lastAnswerCorrect,
    isBookmarked: q.isBookmarked,
  }));

  const wrongCount = problems.filter((p) => !p.isCorrect).length;
  const bookmarkedCount = problems.filter((p) => p.isBookmarked).length;

  const handleResolve = async (mode: ResolveModeType) => {
    let filtered = questions;
    if (mode === "wrong") {
      filtered = questions.filter((q) => !q.lastAnswerCorrect);
    } else if (mode === "bookmarked") {
      filtered = questions.filter((q) => q.isBookmarked);
    }

    if (filtered.length === 0) return;
    setShowActionSheet(false);
    setGenerating(true);

    try {
      // REVIEW 타입 퀴즈 시작
      const quizRaw = await fetchAPI("/api/questionbank/quiz", "POST", {
        type: "REVIEW",
        questionIds: filtered.map((q) => q.questionId),
      });
      const quizData: QuizStartResponse = quizRaw.data ?? quizRaw;

      initSession({
        sessionId: quizData.sessionId,
        sourceType: "REVIEW",
        title: `복습 - ${activeTab === "PDF" ? "강의자료" : "수제 제작"} 문제`,
        questions: quizData.questions.map((q) => ({
          id: q.id,
          questionType: q.type,
          passage: q.content,
          choices: mapChoices(q.choices),
          subject: q.subject,
          hint: q.hint,
        })),
      });
      router.push("/questionbank/solve");
    } catch {
      alert("복습 세션 시작에 실패했습니다.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="flex h-screen flex-col">
      <CustomHeader title="복습하기" showIcon />

      <TabsWithUnderline
        className="mx-6"
        tabs={TABS}
        defaultValue={activeTab}
        onValueChange={setActiveTab}
      />

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-muted-foreground">불러오는 중...</div>
          </div>
        ) : problems.length > 0 ? (
          problems.map((problem) => (
            <ReviewProblemItem key={problem.questionId} problem={problem} />
          ))
        ) : (
          <div className="flex h-full items-center justify-center">
            <p className="text-muted-foreground">아직 풀이 기록이 없습니다.</p>
          </div>
        )}
      </div>

      {/* FAB — 복습 시작 트리거 */}
      {problems.length > 0 && (
        <div className="absolute bottom-28 right-6 z-50">
          <FloatingActionButton
            mainIcon={
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="1 4 1 10 7 10" />
                <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
              </svg>
            }
            size="md"
            className="relative"
            onMainClick={() => setShowActionSheet(true)}
          />
        </div>
      )}

      <ActionSheet
        isOpen={showActionSheet}
        onClose={() => setShowActionSheet(false)}
        onSelectMode={handleResolve}
        totalCount={problems.length}
        wrongCount={wrongCount}
        bookmarkedCount={bookmarkedCount}
      />
      {generating && <LoadingOverlay message="복습 세션 준비 중..." />}
    </div>
  );
};

export default ReviewListPage;
