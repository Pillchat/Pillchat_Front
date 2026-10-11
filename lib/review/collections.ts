import type { CbtGradeResult } from "@/types/cbt";
import type { LocalReviewCollection, ReviewMode } from "@/types/review";

export const REVIEW_STORAGE_KEY = "pillchat:review:collections:v1";
export const REVIEW_UPDATED_EVENT = "pillchat:review-updated";
export const HANDCRAFTED_BOOKMARK_KEY = "pillchat:handcrafted-bookmarks";
export const HANDCRAFTED_BOOKMARK_UPDATED_EVENT =
  "pillchat:handcrafted-bookmarks-updated";

export function readHandcraftedBookmarks(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const value: unknown = JSON.parse(
      window.localStorage.getItem(HANDCRAFTED_BOOKMARK_KEY) ?? "[]",
    );
    return Array.isArray(value)
      ? value
          .filter((id) => typeof id === "string" || typeof id === "number")
          .map(String)
      : [];
  } catch {
    return [];
  }
}

export function setHandcraftedBookmark(
  questionId: string,
  bookmarked: boolean,
): boolean {
  try {
    const ids = new Set(readHandcraftedBookmarks());
    if (bookmarked) ids.add(questionId);
    else ids.delete(questionId);
    window.localStorage.setItem(
      HANDCRAFTED_BOOKMARK_KEY,
      JSON.stringify([...ids]),
    );
    window.dispatchEvent(new Event(HANDCRAFTED_BOOKMARK_UPDATED_EVENT));
    window.dispatchEvent(new Event(REVIEW_UPDATED_EVENT));
    return true;
  } catch {
    return false;
  }
}

const isTutorialQuestion = (question: { id: string; subject: string }) =>
  question.subject === "조작 튜토리얼" || /^T-\d+$/.test(question.id);

export const isTutorialCbtReview = (result: CbtGradeResult): boolean =>
  result.scoresBySubject.some((item) => item.subject === "조작 튜토리얼") ||
  result.review.some(isTutorialQuestion);

const isTutorialCollection = (collection: LocalReviewCollection): boolean =>
  collection.source === "CBT" &&
  (collection.title === "CBT 조작 튜토리얼" ||
    collection.subject === "조작 튜토리얼" ||
    collection.questions.some(isTutorialQuestion));

export function readReviewCollections(): LocalReviewCollection[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(REVIEW_STORAGE_KEY);
  if (!raw) return [];
  const data: unknown = JSON.parse(raw);
  if (!Array.isArray(data)) throw new Error("복습 기록을 읽을 수 없습니다.");
  if (
    data.some(
      (item) =>
        !item ||
        typeof item.id !== "string" ||
        !["CBT", "HANDCRAFTED"].includes(item.source) ||
        !Array.isArray(item.questions) ||
        item.questions.some(
          (question: LocalReviewCollection["questions"][number]) =>
            !question ||
            typeof question.prompt !== "string" ||
            !Array.isArray(question.choices) ||
            !Number.isInteger(question.correctChoice),
        ),
    )
  )
    throw new Error("복습 기록을 읽을 수 없습니다.");
  // 과거 버전에서 보관된 조작 연습도 목록과 직접 상세 진입에서 제외합니다.
  const bookmarks = new Set(readHandcraftedBookmarks());
  const hasBookmarks =
    window.localStorage.getItem(HANDCRAFTED_BOOKMARK_KEY) !== null;
  return (data as LocalReviewCollection[])
    .filter((collection) => !isTutorialCollection(collection))
    .map((collection) =>
      collection.source === "HANDCRAFTED" && hasBookmarks
        ? {
            ...collection,
            questions: collection.questions.map((question) => ({
              ...question,
              bookmarked: bookmarks.has(question.id),
            })),
          }
        : collection,
    );
}

/** 문제 모음별 기록을 보관합니다. 읽기 실패 시 기존 기록을 덮어쓰지 않습니다. */
export function saveReviewCollection(
  collection: LocalReviewCollection,
): boolean {
  if (
    typeof window === "undefined" ||
    !collection.questions.length ||
    isTutorialCollection(collection)
  )
    return true;
  try {
    const collections = readReviewCollections();
    const previous = collections.find((item) => item.id === collection.id);
    const questions = new Map(
      previous?.questions.map((item) => [item.id, item]),
    );
    collection.questions.forEach((item) => questions.set(item.id, item));
    const next = { ...collection, questions: [...questions.values()] };
    window.localStorage.setItem(
      REVIEW_STORAGE_KEY,
      JSON.stringify(
        [next, ...collections.filter((item) => item.id !== collection.id)].sort(
          (a, b) => b.updatedAt.localeCompare(a.updatedAt),
        ),
      ),
    );
    window.dispatchEvent(new Event(REVIEW_UPDATED_EVENT));
    return true;
  } catch {
    return false;
  }
}

export function saveCbtReview(result: CbtGradeResult, title?: string): boolean {
  if (isTutorialCbtReview(result)) return true;
  return saveReviewCollection({
    id: `cbt:${result.attemptId}`,
    source: "CBT",
    title: title ?? "CBT 문제 모음",
    subject: result.scoresBySubject.map((item) => item.subject).join(" · "),
    totalQuestionCount: result.total,
    updatedAt: result.submittedAt,
    questions: result.review.map((question) => ({
      id: question.id,
      prompt: question.stem,
      subject: question.subject,
      topic: question.topic,
      choices: question.choices,
      correctChoice: question.correctChoice,
      selectedChoice: question.selectedChoice,
      status: question.status,
      unknown: question.unknown,
      bookmarked: question.flagged,
      explanation: question.explanation,
      memo: question.memo,
      conceptTags: question.conceptTags,
      media: question.media,
    })),
  });
}

export function migrateRecentCbtReview(): boolean {
  try {
    for (const key of [
      "pillchat:cbt:recent-result:v2",
      "pillchat:cbt:recent-result:v1",
    ]) {
      const raw = window.localStorage.getItem(key);
      if (!raw) continue;
      const result: CbtGradeResult = JSON.parse(raw);
      if (!result.attemptId || !Array.isArray(result.review)) return false;
      if (isTutorialCbtReview(result)) continue;
      if (
        readReviewCollections().some(
          (item) => item.id === `cbt:${result.attemptId}`,
        )
      )
        return true;
      return saveCbtReview(result);
    }
    return true;
  } catch {
    return false;
  }
}

export const reviewCounts = (collection: LocalReviewCollection) => ({
  wrong: collection.questions.filter((item) => item.status === "incorrect")
    .length,
  unanswered: collection.questions.filter(
    (item) => item.status === "unanswered",
  ).length,
  bookmarked:
    collection.source === "HANDCRAFTED"
      ? collection.questions.filter((item) => item.bookmarked).length
      : 0,
});

export const selectReviewQuestions = (
  collection: LocalReviewCollection,
  mode: ReviewMode,
) =>
  collection.questions.filter(
    (question) =>
      mode === "all" ||
      (mode === "wrong"
        ? question.status === "incorrect" || question.status === "unanswered"
        : collection.source === "HANDCRAFTED" && question.bookmarked),
  );
