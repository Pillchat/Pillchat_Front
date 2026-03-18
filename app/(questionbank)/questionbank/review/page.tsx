"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSetAtom } from "jotai";
import { fetchAPI } from "@/lib/functions";
import { initQuizSessionAtom, mapChoices } from "@/store/quizSession";
import { CustomHeader, TabsWithUnderline } from "@/components/molecules";

import CategoryCard from "../_components/CategoryCard";
import ActionSheet from "../_components/ActionSheet";
import LoadingOverlay from "../_components/LoadingOverlay";
import type {
  ReviewCategoryItem,
  QuizStartResponse,
  ServerQuestion,
} from "@/types/questionbank";

const TABS = [
  { value: "PDF", label: "강의자료 문제" },
  { value: "PREMIUM", label: "AI 제작 문제" },
];

const ReviewListPage = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("PDF");
  const [categories, setCategories] = useState<ReviewCategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [selectedTask, setSelectedTask] = useState<ReviewCategoryItem | null>(
    null,
  );
  const [taskQuestions, setTaskQuestions] = useState<ServerQuestion[]>([]);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const initSession = useSetAtom(initQuizSessionAtom);

  const fetchCategories = useCallback(async (sourceType: string) => {
    setLoading(true);
    try {
      const raw = await fetchAPI(
        "/api/questionbank/review/categories",
        "GET",
        { sourceType },
      );
      const data: ReviewCategoryItem[] = raw.items ?? raw;
      setCategories(Array.isArray(data) ? data : []);
    } catch {
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories(activeTab);
  }, [activeTab, fetchCategories]);

  // 카테고리 카드 클릭 → ActionSheet 열기 + 문제 목록 fetch
  const handleCardClick = async (item: ReviewCategoryItem) => {
    setSelectedTask(item);
    setTaskQuestions([]);
    setQuestionsLoading(true);
    setShowActionSheet(true);

    try {
      const raw = await fetchAPI(
        `/api/questionbank/ai-questions/result/${item.taskId}`,
        "GET",
      );
      const data = raw.questions ?? raw;
      setTaskQuestions(Array.isArray(data) ? data : []);
    } catch {
      setTaskQuestions([]);
    } finally {
      setQuestionsLoading(false);
    }
  };

  // ActionSheet 모드 선택 → 퀴즈 시작
  const handleResolve = async (mode: "all" | "wrong" | "bookmarked") => {
    if (!selectedTask) return;
    setShowActionSheet(false);
    setGenerating(true);

    try {
      const bodyMap = {
        all: { type: "PDF", taskId: selectedTask.taskId },
        wrong: { type: "REVIEW", taskId: selectedTask.taskId },
        bookmarked: { type: "BOOKMARK", taskId: selectedTask.taskId },
      };
      const sourceTypeMap = {
        all: "PDF" as const,
        wrong: "REVIEW" as const,
        bookmarked: "BOOKMARK" as const,
      };

      const quizRaw = await fetchAPI(
        "/api/questionbank/quiz",
        "POST",
        bodyMap[mode],
      );
      const quizData: QuizStartResponse = quizRaw.data ?? quizRaw;

      initSession({
        sessionId: quizData.sessionId,
        sourceType: sourceTypeMap[mode],
        title: selectedTask.title,
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
        ) : categories.length > 0 ? (
          categories.map((item) => (
            <CategoryCard
              key={item.taskId}
              item={item}
              onClick={() => handleCardClick(item)}
            />
          ))
        ) : (
          <div className="flex h-full items-center justify-center">
            <p className="text-muted-foreground">
              오답이 있는 문제 모음이 없습니다.
            </p>
          </div>
        )}
      </div>

      {/* 카테고리별 ActionSheet */}
      <ActionSheet
        isOpen={showActionSheet}
        onClose={() => {
          setShowActionSheet(false);
          setTaskQuestions([]);
        }}
        onSelectMode={handleResolve}
        totalCount={selectedTask?.totalQuestionCount ?? 0}
        wrongCount={selectedTask?.wrongCount ?? 0}
        questions={taskQuestions}
        questionsLoading={questionsLoading}
      />
      {generating && <LoadingOverlay message="복습 세션 준비 중..." />}
    </div>
  );
};

export default ReviewListPage;
