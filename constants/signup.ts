export const SIGNUP_GRADE_OPTIONS = [
  "1학년",
  "2학년",
  "3학년",
  "4학년",
  "5학년",
  "6학년",
  "대학원생",
  "약사",
  "기타",
] as const;

export type SignupGrade = (typeof SIGNUP_GRADE_OPTIONS)[number];

export const isSignupGrade = (value: unknown): value is SignupGrade =>
  typeof value === "string" &&
  SIGNUP_GRADE_OPTIONS.some((grade) => grade === value);

export const SIGNUP_SOURCE_OPTIONS = [
  "친구/지인 추천",
  "인스타그램",
  "유튜브",
  "블로그/카페",
  "앱스토어 검색",
  "광고",
  "학교",
  "기타",
] as const;

export type SignupSource = (typeof SIGNUP_SOURCE_OPTIONS)[number];

export const isSignupSource = (value: unknown): value is SignupSource =>
  typeof value === "string" &&
  SIGNUP_SOURCE_OPTIONS.some((source) => source === value);
