/** Keep transport details and backend enum names out of learner-facing copy. */
export function flashcardErrorMessage(
  error: unknown,
  fallback = "요청을 완료하지 못했어요. 잠시 후 다시 시도해 주세요.",
) {
  const status =
    error && typeof error === "object" && "status" in error
      ? error.status
      : undefined;
  if (status === 401) return "로그인이 만료됐어요. 다시 로그인해 주세요.";
  if (status === 403)
    return "이 자료를 이용할 권한이 없어요. 이용 가능한 자료인지 확인해 주세요.";
  if (status === 404)
    return "자료를 찾을 수 없어요. 목록을 새로 불러와 주세요.";
  if (status === 409)
    return "다른 화면에서 내용이 변경됐어요. 최신 내용을 확인하고 다시 시도해 주세요.";
  if (status === 413)
    return "파일이 너무 커요. 30MB 이하의 자료를 선택해 주세요.";
  if (status === 429)
    return "요청이 많아 잠시 기다려야 해요. 조금 뒤 다시 시도해 주세요.";
  return fallback;
}

export const FLASHCARD_FIELD_LABELS: Record<string, string> = {
  term: "질문 · 용어",
  definition: "정답 · 설명",
  triggerText: "원인",
  effect: "결과",
  mechanism: "작용 원리",
  nameA: "첫 번째 비교 대상",
  nameB: "두 번째 비교 대상",
  common: "공통점",
  difference: "차이점",
};

export function generationFailureMessage(code?: string) {
  if (code?.includes("QUOTA") || code?.includes("RATE_LIMIT"))
    return "생성 요청이 많아요. 잠시 후 다시 시도해 주세요.";
  if (code?.includes("TIMEOUT"))
    return "카드 생성 시간이 길어졌어요. 자료를 나눠 다시 시도해 주세요.";
  if (
    code?.includes("OCR") ||
    code?.includes("EMPTY") ||
    code?.includes("TEXT")
  )
    return "자료의 글자를 읽지 못했어요. 글자가 잘 보이는 자료로 다시 시도해 주세요.";
  return "자료에서 카드를 만들지 못했어요. 다른 자료를 선택하거나 잠시 후 다시 시도해 주세요.";
}
