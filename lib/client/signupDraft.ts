import {
  isSignupGrade,
  isSignupSource,
  type SignupGrade,
  type SignupSource,
} from "@/constants/signup";

const SIGNUP_DRAFT_SESSION_KEY = "signup_draft";

export type SignupDraft = {
  realName: string;
  nickname: string;
  grade: SignupGrade;
  university: string;
  signupSource: SignupSource;
  agreeToTerms: boolean;
  agreeToPrivacy: boolean;
};

const isBrowser = () => typeof window !== "undefined";

export const isSignupDraft = (value: unknown): value is SignupDraft => {
  if (!value || typeof value !== "object") return false;

  const draft = value as Record<string, unknown>;

  return (
    typeof draft.realName === "string" &&
    typeof draft.nickname === "string" &&
    isSignupGrade(draft.grade) &&
    typeof draft.university === "string" &&
    isSignupSource(draft.signupSource) &&
    typeof draft.agreeToTerms === "boolean" &&
    typeof draft.agreeToPrivacy === "boolean"
  );
};

export const saveSignupDraft = (draft: SignupDraft) => {
  if (!isBrowser()) return;
  window.sessionStorage.setItem(
    SIGNUP_DRAFT_SESSION_KEY,
    JSON.stringify(draft),
  );
};

export const getSignupDraft = (): SignupDraft | null => {
  if (!isBrowser()) return null;

  try {
    const raw = window.sessionStorage.getItem(SIGNUP_DRAFT_SESSION_KEY);
    if (!raw) return null;

    const parsed: unknown = JSON.parse(raw);
    return isSignupDraft(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

export const clearSignupDraft = () => {
  if (!isBrowser()) return;
  window.sessionStorage.removeItem(SIGNUP_DRAFT_SESSION_KEY);
};
