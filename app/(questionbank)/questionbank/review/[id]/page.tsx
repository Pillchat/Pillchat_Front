"use client";

import { useState, useEffect } from "react";
import { useRouter } from "@/lib/navigation";
import { useParams } from "next/navigation";
import { useSetAtom } from "jotai";
import { fetchAPI } from "@/lib/functions";
import { CustomHeader } from "@/components/molecules";
import { FloatingActionButton } from "@/components/atoms";
import { initQuizSessionAtom, mapChoices } from "@/store/quizSession";
import ReviewProblemItem from "../../_components/ReviewProblemItem";
import ActionSheet from "../../_components/ActionSheet";
import LoadingOverlay from "../../_components/LoadingOverlay";
import type {
  ReviewProblemItemData,
  QuizResultResponse,
  QuizStartResponse,
} from "@/types/questionbank";

const ReviewDetailPage = () => {
  const router = useRouter();
  const params = useParams();
  const sessionId = params.id as string;
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [result, setResult] = useState<QuizResultResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const initQuiz = useSetAtom(initQuizSessionAtom);

  useEffect(() => {
    const fetchResult = async () => {
      try {
        const raw = await fetchAPI(
          `/api/questionbank/quiz/${sessionId}`,
          "GET",
        );
        const data: QuizResultResponse = raw.data ?? raw;
        setResult(data);
      } catch {
        // 결과를 불러오지 못한 경우
      } finally {
        setLoading(false);
      }
    };
    fetchResult();
  }, [sessionId]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-muted-foreground">불러오는 중...</div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="flex h-screen flex-col">
        <CustomHeader title="복습 상세" showIcon />
        <div className="flex flex-1 items-center justify-center">
          <p className="text-muted-foreground">결과를 불러올 수 없습니다.</p>
        </div>
      </div>
    );
  }

  const problems: ReviewProblemItemData[] = result.answers.map((a, i) => ({
    questionId: a.questionId,
    index: i,
    passagePreview: a.content,
    answerPreview: a.correctAnswer,
    isCorrect: a.isCorrect,
    isBookmarked: false,
  }));

  const totalCount = result.questionCount;
  const correctCount = result.correctCount;
  const wrongCount = totalCount - correctCount;

  const handleResolve = async (mode: "all" | "wrong" | "bookmarked") => {
    setShowActionSheet(false);
    setGenerating(true);

    try {
      const bodyMap = {
        all: { type: "PDF" },
        wrong: { type: "REVIEW" },
        bookmarked: { type: "BOOKMARK" },
      };
      const body = bodyMap[mode];

      const quizRaw = await fetchAPI("/api/questionbank/quiz", "POST", body);
      const quizData: QuizStartResponse = quizRaw.data ?? quizRaw;

      initQuiz({
        sessionId: quizData.sessionId,
        sourceType: (
          { all: "PDF", wrong: "REVIEW", bookmarked: "BOOKMARK" } as const
        )[mode],
        title: "복습 다시 풀기",
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
      <CustomHeader title="복습 상세" showIcon />

      {/* 통계 요약 */}
      <div className="flex items-center gap-4 border-b px-6 py-3">
        <span className="text-sm text-muted-foreground">
          총 {totalCount}문제
        </span>
        <span className="text-sm font-medium text-green-500">
          정답 {correctCount}
        </span>
        <span className="text-sm font-medium text-red-500">
          오답 {wrongCount}
        </span>
      </div>

      {/* 문제 리스트 */}
      <div className="flex-1 overflow-y-auto">
        {problems.map((problem) => (
          <ReviewProblemItem key={problem.questionId} problem={problem} />
        ))}
      </div>

      {/* FAB — 복습 시작 트리거 */}
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

      <ActionSheet
        isOpen={showActionSheet}
        onClose={() => setShowActionSheet(false)}
        onSelectMode={handleResolve}
        totalCount={totalCount}
        wrongCount={wrongCount}
      />
      {generating && <LoadingOverlay message="복습 세션 준비 중..." />}
    </div>
  );
};

export default ReviewDetailPage;
