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
  source: ReviewSource;
  subject: string;
  collectionRef: string;
};
export type WeaknessCollection = {
  collectionRef: string;
  source: ReviewSource;
  title: string;
};
export type WeaknessLibrary = {
  questions: WeaknessQuestion[];
  collections: WeaknessCollection[];
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
// shortcut: 일정·정렬·헷갈림 API 연결 전에는 출처로만 기존 오답을 필터링한다.
export function weaknessQuestions(
  data: WeaknessLibrary | undefined,
  filters: WeaknessFilters,
) {
  return (
    data?.questions.filter((question) =>
      filters.sources.includes(question.source),
    ) ?? []
  );
}
export function weaknessCount(
  data: WeaknessLibrary | undefined,
  filters: WeaknessFilters,
) {
  return !data || filters.range === "today"
    ? null
    : weaknessQuestions(data, filters).length;
}
