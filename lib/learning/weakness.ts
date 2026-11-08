import type { ReviewSource } from "@/types/review";

export const WEAKNESS_SOURCES: ReviewSource[] = ["HANDCRAFTED", "CBT", "AI"];
export const WEAKNESS_SOURCE_LABELS: Record<ReviewSource, string> = {
  HANDCRAFTED: "수제 제작",
  CBT: "CBT",
  AI: "AI 생성",
};
export const WEAKNESS_RANGES = {
  all: "전체 약점",
  today: "오늘 복습",
  wrong: "오답만",
};
export const WEAKNESS_SORTS = {
  due: "복습 예정일 빠른 순",
  accuracy: "오답률 높은 순",
  recent: "최근 틀린 순",
};
export type WeaknessFilters = {
  range: keyof typeof WEAKNESS_RANGES;
  sources: ReviewSource[];
  sort: keyof typeof WEAKNESS_SORTS;
};
export type WeaknessQuestion = {
  id: string;
  questionId: string;
  source: ReviewSource;
  subject: string;
  collectionRef: string;
  status: "UNATTEMPTED" | "HISTORY" | "WEAKNESS" | "MASTERED";
  confused: boolean;
  wrong: boolean;
  consecutiveCorrect: number;
  totalAttempts: number;
  wrongAttempts: number;
  wrongRate: number;
  dueDate: string | null;
  lastPracticedAt: string | null;
  lastWrongAt: string | null;
  topic?: string | null;
  firstPracticedAt?: string | null;
  firstOutcome?: string | null;
  firstConfused?: boolean;
  masteredAt?: string | null;
};
export type WeaknessCollection = {
  collectionRef: string;
  source: ReviewSource;
  title: string;
};
export type WeaknessLibrary = {
  serverDate: string;
  questions: WeaknessQuestion[];
  collections: WeaknessCollection[];
};
export type WeaknessStart = {
  source: ReviewSource;
  range: WeaknessFilters["range"];
  sort: WeaknessFilters["sort"];
  collectionRef?: string;
  subject?: string;
  idempotencyKey: string;
};

export function readWeaknessFilters(
  query: Record<string, string | string[] | undefined>,
): WeaknessFilters {
  const one = (value: string | string[] | undefined) =>
    Array.isArray(value) ? value[0] : value;
  const range = one(query.range),
    sort = one(query.sort),
    selected = one(query.sources);
  return {
    range: range === "today" || range === "wrong" ? range : "all",
    sort: sort === "accuracy" || sort === "recent" ? sort : "due",
    sources:
      selected === undefined
        ? [...WEAKNESS_SOURCES]
        : WEAKNESS_SOURCES.filter((source) =>
            selected.split(",").includes(source),
          ),
  };
}
export function weaknessHref(filters: WeaknessFilters, page = "") {
  const query = new URLSearchParams({
    range: filters.range,
    sources: filters.sources.join(","),
    sort: filters.sort,
  });
  return `/learning/weakness${page ? `/${page}` : ""}?${query}`;
}

export function compareWeakness(sort: WeaknessFilters["sort"]) {
  const date = (value: string | null) =>
    value ? Date.parse(value) : -Infinity;
  const due = (a: WeaknessQuestion, b: WeaknessQuestion) =>
    (a.dueDate ?? "9999").localeCompare(b.dueDate ?? "9999");
  return (a: WeaknessQuestion, b: WeaknessQuestion) => {
    const order =
      sort === "accuracy"
        ? b.wrongRate - a.wrongRate || due(a, b)
        : sort === "recent"
          ? date(b.lastWrongAt) - date(a.lastWrongAt)
          : due(a, b);
    return order || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
  };
}
function nextReviewDate(serverDate: string) {
  const day = Date.parse(serverDate);
  return Number.isFinite(day)
    ? new Date(day + 86400000).toISOString().slice(0, 10)
    : serverDate;
}

function weaknessQuestionsDueBy(
  data: WeaknessLibrary | undefined,
  filters: WeaknessFilters,
  dueBy: string | undefined,
) {
  if (!data || !dueBy) return [];
  return data.questions
    .filter(
      (q) =>
        q.status === "WEAKNESS" &&
        filters.sources.includes(q.source) &&
        q.dueDate !== null &&
        q.dueDate <= dueBy &&
        (filters.range !== "wrong" || q.wrong),
    )
    .sort(compareWeakness(filters.sort));
}

export function weaknessQuestions(
  data: WeaknessLibrary | undefined,
  filters: WeaknessFilters,
) {
  return weaknessQuestionsDueBy(data, filters, data?.serverDate);
}

export function scheduledWeaknessQuestions(
  data: WeaknessLibrary | undefined,
  filters: WeaknessFilters,
) {
  const dueBy = data
    ? filters.range === "today"
      ? data.serverDate
      : nextReviewDate(data.serverDate)
    : undefined;
  return weaknessQuestionsDueBy(data, filters, dueBy);
}

export function weaknessReviewDay(
  dueDate: string | null | undefined,
  serverDate: string | undefined,
) {
  if (!dueDate || !serverDate) return null;
  if (dueDate <= serverDate) return "오늘";
  if (dueDate === nextReviewDate(serverDate)) return "내일";
  return dueDate.slice(5).replace("-", "/");
}

export function weaknessCount(
  data: WeaknessLibrary | undefined,
  filters: WeaknessFilters,
) {
  return data ? weaknessQuestions(data, filters).length : null;
}
export function weaknessFields(
  data: WeaknessLibrary | undefined,
  filters: WeaknessFilters,
) {
  const questions =
    data?.questions.filter((q) => filters.sources.includes(q.source)) ?? [];
  const subjects = [
    ...new Set(
      questions.filter((q) => q.status === "WEAKNESS").map((q) => q.subject),
    ),
  ];
  return subjects
    .map((subject) => {
      const rows = questions.filter((q) => q.subject === subject);
      const hasFirstHistory = rows.some(
        (q) => q.firstPracticedAt !== undefined,
      );
      const recent = rows.filter((q) =>
        inRecentDays(q.firstPracticedAt, data?.serverDate, 30),
      );
      const total = hasFirstHistory
        ? recent.length
        : rows.reduce((sum, q) => sum + q.totalAttempts, 0);
      const wrong = hasFirstHistory
        ? recent.filter(
            (q) => q.firstOutcome === "INCORRECT" || q.firstConfused,
          ).length
        : rows.reduce((sum, q) => sum + q.wrongAttempts, 0);
      return {
        subject,
        wrongRate: total ? (100 * wrong) / total : 0,
        count: rows.filter((q) => q.status === "WEAKNESS").length,
      };
    })
    .sort(
      (a, b) =>
        b.wrongRate - a.wrongRate ||
        b.count - a.count ||
        a.subject.localeCompare(b.subject, "ko"),
    );
}

export function koreanStudyDate(value: string | null | undefined) {
  if (!value) return null;
  const time = Date.parse(value);
  return Number.isFinite(time)
    ? new Date(time + 9 * 60 * 60 * 1000).toISOString().slice(0, 10)
    : null;
}
function inRecentDays(
  value: string | null | undefined,
  today: string | undefined,
  days: number,
) {
  const date = koreanStudyDate(value);
  if (!date || !today) return false;
  const from = new Date(
    Date.parse(`${today}T00:00:00Z`) - (days - 1) * 86400000,
  )
    .toISOString()
    .slice(0, 10);
  return date >= from && date <= today;
}
export function recentlyMastered(
  data: WeaknessLibrary | undefined,
  filters: WeaknessFilters,
) {
  return data
    ? data.questions.filter(
        (q) =>
          filters.sources.includes(q.source) &&
          q.status === "MASTERED" &&
          inRecentDays(q.masteredAt, data.serverDate, 7),
      ).length
    : null;
}
