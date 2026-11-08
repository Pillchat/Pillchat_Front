import { REVIEW_SOURCE_LABELS, type ReviewSource } from "@/types/review";

export function learningSourceLabel(source: ReviewSource, title: string) {
  const label = REVIEW_SOURCE_LABELS[source];
  const name = title.trim();
  return name === label || (source === "AI" && name === "AI 문제 풀이")
    ? null
    : label;
}
