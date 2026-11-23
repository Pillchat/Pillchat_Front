import { REVIEW_SOURCE_LABELS, type ReviewSource } from "@/types/review";

export function learningDisplayTitle(
  source: ReviewSource,
  title?: string | null,
) {
  const name = title?.trim();
  if (!name) return REVIEW_SOURCE_LABELS[source];

  return source === "HANDCRAFTED"
    ? name.replace(
        /수제\s*(?:제작\s*)?문제/g,
        REVIEW_SOURCE_LABELS.HANDCRAFTED,
      )
    : name;
}

export function learningSourceLabel(source: ReviewSource, title?: string | null) {
  const label = REVIEW_SOURCE_LABELS[source];
  const name = learningDisplayTitle(source, title);
  return name === label || (source === "AI" && name === "AI 문제 풀이")
    ? null
    : label;
}
