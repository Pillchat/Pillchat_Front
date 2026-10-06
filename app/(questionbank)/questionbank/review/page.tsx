"use client";

import { LoadingIndicator } from "@/components/atoms/LoadingIndicator";

import { useState, useEffect } from "react";
import { useRouter } from "@/lib/navigation";
import { useSetAtom } from "jotai";
import { fetchAPI } from "@/lib/client/fetch";
import { initQuizSessionAtom, mapChoices } from "@/store/quizSession";
import { PracticeHeader } from "@/components/molecules";
import { RotateCcw } from "lucide-react";
import {
  REVIEW_SOURCE_LABELS,
  type ReviewSource,
  type LocalReviewCollection,
} from "@/types/review";
import {
  readReviewCollections,
  migrateRecentCbtReview,
  reviewCounts,
  REVIEW_UPDATED_EVENT,
} from "@/lib/review/collections";

import CategoryCard from "../_components/CategoryCard";
import ActionSheet from "../_components/ActionSheet";
import LoadingOverlay from "../_components/LoadingOverlay";
import type {
  ReviewCategoryItem,
  QuizStartResponse,
  ServerQuestion,
} from "@/types/questionbank";

const ReviewListPage = () => {
  const router = useRouter();
  const [category, setCategory] = useState<ReviewSource>("CBT");
  const [localCollections, setLocalCollections] = useState<
    LocalReviewCollection[]
  >([]);
  const [localError, setLocalError] = useState(false);
  const [remoteError, setRemoteError] = useState(false);
  const [fetchVersion, setFetchVersion] = useState(0);
  const [categories, setCategories] = useState<ReviewCategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [selectedCollection, setSelectedCollection] =
    useState<LocalReviewCollection | null>(null);
  const [selectedTask, setSelectedTask] = useState<ReviewCategoryItem | null>(
    null,
  );
  const [taskQuestions, setTaskQuestions] = useState<ServerQuestion[]>([]);
  const [aiBookmarkedIds, setAiBookmarkedIds] = useState<number[] | null>(null);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const initSession = useSetAtom(initQuizSessionAtom);

  useEffect(() => {
    const initialCategory = new URLSearchParams(window.location.search).get(
      "category",
    );
    if (
      initialCategory === "CBT" ||
      initialCategory === "HANDCRAFTED" ||
      initialCategory === "AI"
    )
      setCategory(initialCategory);
    const refresh = () => {
      try {
        const migrated = migrateRecentCbtReview();
        const collections = readReviewCollections();
        setLocalCollections(collections);
        const collectionId = new URLSearchParams(window.location.search).get(
          "collection",
        );
        const selected = collections.find((item) => item.id === collectionId);
        if (selected) {
          setCategory(selected.source);
          setSelectedCollection(selected);
          setShowActionSheet(true);
        }
        setLocalError(!migrated);
      } catch {
        setLocalError(true);
      }
    };
    refresh();
    window.addEventListener("storage", refresh);
    window.addEventListener(REVIEW_UPDATED_EVENT, refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener(REVIEW_UPDATED_EVENT, refresh);
    };
  }, []);

  useEffect(() => {
    if (category !== "AI") return;
    let cancelled = false;
    setLoading(true);
    setRemoteError(false);
    const fetchCategories = async () => {
      try {
        const raw = await fetchAPI(
          "/api/questionbank/review/categories",
          "GET",
          {
            sourceType: "PREMIUM",
          },
        );
        const response = raw.data ?? raw;
        const data: ReviewCategoryItem[] = response.items ?? response;
        if (!Array.isArray(data)) throw new Error("복습 목록 응답 오류");
        if (!cancelled) setCategories(data);
      } catch {
        if (!cancelled) setRemoteError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void fetchCategories();
    return () => {
      cancelled = true;
    };
  }, [category, fetchVersion]);

  // 카테고리 카드 클릭 → ActionSheet 열기 + 문제 목록 fetch
  const handleCardClick = async (item: ReviewCategoryItem) => {
    setSelectedCollection(null);
    setSelectedTask(item);
    setTaskQuestions([]);
    setAiBookmarkedIds(null);
    setQuestionsLoading(true);
    setShowActionSheet(true);

    try {
      const [questionsResult, bookmarksResult] = await Promise.allSettled([
        fetchAPI(`/api/questionbank/ai-questions/result/${item.taskId}`, "GET"),
        fetchAPI("/api/questionbank/bookmarks", "GET"),
      ]);
      if (questionsResult.status === "rejected") throw questionsResult.reason;
      const response = questionsResult.value.data ?? questionsResult.value;
      const data = response.questions ?? response;
      setTaskQuestions(Array.isArray(data) ? data : []);
      if (bookmarksResult.status === "fulfilled") {
        const bookmarksResponse =
          bookmarksResult.value.data ?? bookmarksResult.value;
        const bookmarks =
          bookmarksResponse.items ??
          bookmarksResponse.content ??
          bookmarksResponse;
        if (Array.isArray(bookmarks))
          setAiBookmarkedIds(
            bookmarks
              .filter((item) => item.isBookmarked !== false)
              .map((item) => item.questionId),
          );
      }
    } catch {
      setTaskQuestions([]);
    } finally {
      setQuestionsLoading(false);
    }
  };

  // ActionSheet 모드 선택 → 퀴즈 시작
  const handleResolve = async (mode: "all" | "wrong" | "bookmarked") => {
    if (selectedCollection) {
      const url = new URL(window.location.href);
      if (url.searchParams.has("collection")) {
        url.searchParams.delete("collection");
        window.history.replaceState(null, "", url.pathname + url.search);
      }
      router.push(
        `/questionbank/review/sets/${encodeURIComponent(selectedCollection.id)}?mode=${mode}`,
      );
      return;
    }
    if (!selectedTask) return;
    setShowActionSheet(false);
    setGenerating(true);

    try {
      const bodyMap = {
        all: { type: "PREMIUM", taskId: selectedTask.taskId },
        wrong: { type: "REVIEW", taskId: selectedTask.taskId },
        bookmarked: { type: "BOOKMARK", taskId: selectedTask.taskId },
      };
      const sourceTypeMap = {
        all: "PREMIUM" as const,
        wrong: "REVIEW" as const,
        bookmarked: "BOOKMARK" as const,
      };

      const quizRaw = await fetchAPI(
        "/api/questionbank/quiz",
        "POST",
        bodyMap[mode],
      );
      const quizData: QuizStartResponse = quizRaw.data ?? quizRaw;
      if (!quizData.questions.length) {
        alert("선택한 범위에 복습할 문제가 없습니다.");
        return;
      }
      const answerByQuestionId = new Map(
        taskQuestions.map((question) => [question.id, question]),
      );

      initSession({
        sessionId: quizData.sessionId,
        sourceType: sourceTypeMap[mode],
        title: selectedTask.title,
        reviewMode: mode,
        bookmarkedQuestionIds:
          aiBookmarkedIds ??
          (mode === "bookmarked"
            ? quizData.questions.map((question) => question.id)
            : []),
        questions: quizData.questions.map((q) => {
          const answer = answerByQuestionId.get(q.id);
          const quizQuestion = q as typeof q & {
            answer?: string;
            correctAnswer?: string;
            explanation?: string | null;
          };

          return {
            id: q.id,
            questionType: q.type,
            passage: q.content,
            choices: mapChoices(q.choices),
            subject: q.subject,
            hint: q.hint,
            correctAnswer:
              answer?.answer ??
              quizQuestion.answer ??
              quizQuestion.correctAnswer,
            explanation:
              answer?.explanation ?? quizQuestion.explanation ?? undefined,
          };
        }),
      });
      router.push("/questionbank/solve");
    } catch {
      alert("복습 세션 시작에 실패했습니다.");
    } finally {
      setGenerating(false);
    }
  };

  const visibleCollections = localCollections.filter(
    (item) => item.source === category,
  );
  const changeCategory = (value: ReviewSource) => {
    setCategory(value);
    window.history.replaceState(
      null,
      "",
      `/questionbank/review?category=${value}`,
    );
  };

  return (
    <div className="flex min-h-dvh flex-col bg-white">
      <PracticeHeader title="복습하기" backHref="/questionbank" />
      <div className="px-5 pb-5 pt-4">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent">
            <RotateCcw className="h-6 w-6 text-primary" />
          </span>
          <div>
            <h1 className="text-xl font-bold">오답을 모아 다시 학습해요</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              풀었던 문제 모음에서 복습할 문제를 골라보세요.
            </p>
          </div>
        </div>
      </div>
      <div
        className="grid grid-cols-3 border-b px-3"
        role="tablist"
        aria-label="문제 출처"
      >
        {(Object.keys(REVIEW_SOURCE_LABELS) as ReviewSource[]).map((source) => (
          <button
            key={source}
            id={`review-tab-${source}`}
            type="button"
            role="tab"
            aria-selected={category === source}
            aria-controls="review-panel"
            onClick={() => changeCategory(source)}
            className={`border-b-2 px-1 py-3 text-sm font-semibold ${category === source ? "border-primary text-primary" : "border-transparent text-muted-foreground"}`}
          >
            {REVIEW_SOURCE_LABELS[source]}
          </button>
        ))}
      </div>
      <div
        id="review-panel"
        role="tabpanel"
        aria-labelledby={`review-tab-${category}`}
        className="flex-1 pb-8"
      >
        <p className="px-6 pb-2 pt-5 text-sm font-semibold text-muted-foreground">
          {category === "CBT" ? "CBT 문제" : REVIEW_SOURCE_LABELS[category]}{" "}
          모음
        </p>
        {category !== "AI" && localError && (
          <p
            role="alert"
            className="mx-5 rounded-xl bg-red-50 p-3 text-sm text-red-700"
          >
            일부 복습 기록을 읽지 못했어요. 기존 기록은 보관되어 있어요.
          </p>
        )}
        {category === "AI" ? (
          loading ? (
            <LoadingIndicator
              label="불러오는 중..."
              className="py-16 text-center text-sm text-muted-foreground"
            />
          ) : remoteError ? (
            <div className="p-8 text-center">
              <p role="alert" className="text-sm text-muted-foreground">
                AI 생성 문제의 복습 목록을 불러오지 못했어요.
              </p>
              <button
                type="button"
                onClick={() => setFetchVersion((value) => value + 1)}
                className="mt-4 text-sm font-semibold text-primary"
              >
                다시 불러오기
              </button>
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
            <EmptyState source={category} />
          )
        ) : visibleCollections.length > 0 ? (
          visibleCollections.map((item) => {
            const counts = reviewCounts(item);
            return (
              <CategoryCard
                key={item.id}
                item={{
                  ...item,
                  totalQuestionCount: item.questions.length,
                  wrongCount: counts.wrong,
                }}
                unansweredCount={counts.unanswered}
                dateLabel={new Date(item.updatedAt).toLocaleString("ko-KR", {
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
                onClick={() => {
                  setSelectedTask(null);
                  setSelectedCollection(item);
                  setShowActionSheet(true);
                }}
              />
            );
          })
        ) : (
          !localError && <EmptyState source={category} />
        )}
      </div>

      {/* 카테고리별 ActionSheet */}
      <ActionSheet
        isOpen={showActionSheet}
        onClose={() => {
          setShowActionSheet(false);
          setTaskQuestions([]);
          const url = new URL(window.location.href);
          if (url.searchParams.has("collection")) {
            url.searchParams.delete("collection");
            window.history.replaceState(null, "", url.pathname + url.search);
          }
        }}
        onSelectMode={handleResolve}
        totalCount={
          selectedCollection?.questions.length ??
          selectedTask?.totalQuestionCount ??
          0
        }
        wrongCount={
          selectedCollection
            ? reviewCounts(selectedCollection).wrong
            : (selectedTask?.wrongCount ?? 0)
        }
        unansweredCount={
          selectedCollection ? reviewCounts(selectedCollection).unanswered : 0
        }
        allowBookmarks={selectedCollection?.source !== "CBT"}
        bookmarkedCount={
          selectedCollection
            ? reviewCounts(selectedCollection).bookmarked
            : aiBookmarkedIds
              ? taskQuestions.filter((question) =>
                  aiBookmarkedIds.includes(question.id),
                ).length
              : undefined
        }
        questions={
          selectedCollection
            ? selectedCollection.questions.map((question) => ({
                id: question.id,
                content: question.prompt,
                answer: question.choices[question.correctChoice],
              }))
            : taskQuestions
        }
        questionsLoading={!selectedCollection && questionsLoading}
      />
      {generating && <LoadingOverlay message="복습 세션 준비 중..." />}
    </div>
  );
};

function EmptyState({ source }: { source: ReviewSource }) {
  const href =
    source === "CBT"
      ? "/learning/cbt"
      : source === "HANDCRAFTED"
        ? "/questionbank/handcrafted"
        : "/questionbank/premium";
  const router = useRouter();
  return (
    <div className="px-6 py-14 text-center">
      <RotateCcw className="mx-auto h-9 w-9 text-gray-300" />
      <p className="mt-4 font-semibold">아직 복습할 문제 모음이 없어요</p>
      <p className="mt-2 text-sm text-muted-foreground">
        {REVIEW_SOURCE_LABELS[source]}를 풀면 오답을 여기서 복습할 수 있어요.
      </p>
      <button
        type="button"
        onClick={() => router.push(href)}
        className="mt-6 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white"
      >
        문제 풀러 가기
      </button>
    </div>
  );
}

export default ReviewListPage;
