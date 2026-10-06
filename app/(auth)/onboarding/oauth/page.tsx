"use client";

import { PUBLIC_ASSETS } from "@/constants/assets";
import { SolidButton } from "@/components/atoms";
import { StepHeader } from "@/components/molecules";
import type { SignupGrade, SignupSource } from "@/constants/signup";
import { useAuth } from "@/hooks";
import { clearSignupDraft } from "@/lib/client/signupDraft";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { SignupInfoFlow } from "../../signup/_components/SignupInfoFlow";
import { PRIVACY_TEXT, TERMS_TEXT } from "../../signup/_hooks";
import {
  clearPendingOAuthSignup,
  getPendingOAuthSignup,
  type PendingOAuthSignup,
} from "../../login/_utils/oauthSignup";

type OAuthSignupStep = "info" | "terms" | "privacy";

const isValidNickname = (nickname: string) =>
  /^[가-힣A-Za-z0-9]{2,}$/.test(nickname.trim());

const OAuthOnboardingPage = () => {
  const router = useRouter();
  const { saveTokensAndSetupRefresh } = useAuth();
  const [pendingSignup, setPendingSignup] = useState<PendingOAuthSignup | null>(
    null,
  );
  const [step, setStep] = useState<OAuthSignupStep>("info");
  const [realName, setRealName] = useState("");
  const [nickname, setNickname] = useState("");
  const [university, setUniversity] = useState("");
  const [grade, setGrade] = useState<SignupGrade | "">("");
  const [signupSource, setSignupSource] = useState<SignupSource | "">("");
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [agreeToPrivacy, setAgreeToPrivacy] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const session = getPendingOAuthSignup();

    if (!session) {
      router.replace("/login");
      return;
    }

    const draft = session.signupDraft;

    setPendingSignup(session);
    setRealName(draft?.realName ?? session.name ?? "");
    setNickname(draft?.nickname ?? "");
    setUniversity(draft?.university ?? "");
    setGrade(draft?.grade ?? "");
    setSignupSource(draft?.signupSource ?? "");
    setAgreeToTerms(draft?.agreeToTerms ?? false);
    setAgreeToPrivacy(draft?.agreeToPrivacy ?? false);
  }, [router]);

  const isInfoValid = Boolean(
    realName.trim() && isValidNickname(nickname) && grade && signupSource,
  );
  const isReturningFromSignup = Boolean(pendingSignup?.signupDraft);
  const isSubmitValid = Boolean(
    isInfoValid && agreeToTerms && agreeToPrivacy && grade && signupSource,
  );

  const goBack = () => {
    setError(null);

    if (step === "privacy") {
      setStep("terms");
      return;
    }

    if (step === "terms") {
      setStep("info");
      return;
    }

    clearPendingOAuthSignup();

    if (isReturningFromSignup) {
      router.replace("/signup");
      return;
    }

    clearSignupDraft();
    router.replace("/login");
  };

  const handleCompleteSignup = async () => {
    if (!pendingSignup || !grade || !signupSource || !isSubmitValid) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/oauth/complete-signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          oauthSignupToken: pendingSignup.oauthSignupToken,
          provider: pendingSignup.provider,
          email: pendingSignup.email,
          documentType: "student",
          nickname: nickname.trim(),
          realName: realName.trim(),
          agreeToTerms,
          agreeToPrivacy,
          university: university.trim(),
          grade,
          signupSource,
        }),
      });

      const result = await response.json().catch(() => null);

      if (!response.ok || !result?.success) {
        throw new Error(result?.message || "OAuth 회원가입에 실패했습니다.");
      }

      const accessToken =
        result.data?.access_token ??
        result.data?.accessToken ??
        result.data?.access;
      const refreshToken =
        result.data?.refresh_token ??
        result.data?.refreshToken ??
        result.data?.refresh;

      if (!accessToken || !refreshToken) {
        throw new Error("OAuth 회원가입 응답에 토큰 데이터가 없습니다.");
      }

      saveTokensAndSetupRefresh(
        accessToken,
        refreshToken,
        pendingSignup.rememberMe,
      );
      clearPendingOAuthSignup();
      clearSignupDraft();
      router.replace("/");
    } catch (caughtError: unknown) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "OAuth 회원가입에 실패했습니다.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInfoNext = () => {
    if (!isInfoValid) return;

    if (agreeToTerms && agreeToPrivacy) {
      void handleCompleteSignup();
      return;
    }

    setStep("terms");
  };

  if (!pendingSignup) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <p className="text-sm text-muted-foreground">불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col items-center">
      {step === "info" && (
        <SignupInfoFlow
          realName={realName}
          nickname={nickname}
          grade={grade}
          university={university}
          signupSource={signupSource}
          onRealNameChange={setRealName}
          onNicknameChange={setNickname}
          onGradeChange={setGrade}
          onUniversityChange={setUniversity}
          onSignupSourceChange={setSignupSource}
          onExit={goBack}
          onComplete={handleInfoNext}
          completeLabel={isReturningFromSignup ? "가입 완료" : "다음"}
          isCompleting={isSubmitting}
          error={error}
        />
      )}

      {step === "terms" && (
        <div className="flex w-full flex-1 flex-col">
          <StepHeader content="서비스 이용약관" onIconClick={goBack} />

          <div className="mx-auto flex min-h-0 w-[90%] flex-1 flex-col">
            <textarea
              className="scrollbar-hide min-h-0 w-full flex-1 overflow-y-auto whitespace-pre-wrap bg-white text-[13px] font-medium"
              readOnly
              disabled
              value={TERMS_TEXT}
            />
          </div>

          <div className="z-[1] mb-14 mt-auto flex w-full flex-col items-center bg-[linear-gradient(to_top,_#FFFFFF_0%,_#FFFFFF_24%,_transparent_100%)] shadow-[0_-22px_24px_rgba(255,255,255,0.3),_0_-50px_40px_rgba(255,255,255,0.6)]">
            <button
              type="button"
              aria-pressed={agreeToTerms}
              className="mt-[1rem] flex flex-row items-center justify-center gap-[0.15rem]"
              onClick={() => setAgreeToTerms((checked) => !checked)}
            >
              <Image
                className="h-[26px] w-[26px]"
                width={26}
                height={26}
                src={
                  agreeToTerms
                    ? PUBLIC_ASSETS.icons.checkCircleFilled
                    : PUBLIC_ASSETS.icons.checkCircleMuted
                }
                alt=""
              />
              <div className="flex flex-row text-sm font-medium">
                <p className="text-brand underline underline-offset-2">
                  서비스 이용약관
                </p>
                <p>에 동의합니다.</p>
              </div>
            </button>

            <div className="font-regular mt-[1rem] w-[90%]">
              <SolidButton
                content="다음"
                variant={agreeToTerms ? "brand" : "disabled"}
                disabled={!agreeToTerms}
                onClick={() => setStep("privacy")}
              />
            </div>
          </div>
        </div>
      )}

      {step === "privacy" && (
        <div className="flex w-full flex-1 flex-col">
          <StepHeader content="개인정보 처리방침" onIconClick={goBack} />

          <div className="mx-auto flex min-h-0 w-[90%] flex-1 flex-col">
            <textarea
              className="scrollbar-hide min-h-0 w-full flex-1 overflow-y-auto whitespace-pre-wrap bg-white text-[13px] font-medium"
              readOnly
              disabled
              value={PRIVACY_TEXT}
            />
          </div>

          <div className="z-[1] mb-14 mt-auto flex w-full flex-col items-center bg-[linear-gradient(to_top,_#FFFFFF_0%,_#FFFFFF_24%,_transparent_100%)] shadow-[0_-22px_24px_rgba(255,255,255,0.3),_0_-50px_40px_rgba(255,255,255,0.6)]">
            <button
              type="button"
              aria-pressed={agreeToPrivacy}
              className="mt-[1rem] flex flex-row items-center justify-center gap-[0.15rem]"
              onClick={() => setAgreeToPrivacy((checked) => !checked)}
            >
              <Image
                className="h-[26px] w-[26px]"
                width={26}
                height={26}
                src={
                  agreeToPrivacy
                    ? PUBLIC_ASSETS.icons.checkCircleFilled
                    : PUBLIC_ASSETS.icons.checkCircleMuted
                }
                alt=""
              />
              <div className="flex flex-row text-sm font-medium">
                <p className="text-brand underline underline-offset-2">
                  개인정보 처리방침
                </p>
                <p>에 동의합니다.</p>
              </div>
            </button>

            {error && (
              <p className="mt-3 w-[90%] text-sm text-destructive">{error}</p>
            )}

            <div className="font-regular mt-[1rem] w-[90%]">
              <SolidButton
                content={isSubmitting ? "가입 중..." : "완료"}
                variant={isSubmitValid && !isSubmitting ? "brand" : "disabled"}
                disabled={!isSubmitValid || isSubmitting}
                onClick={() => void handleCompleteSignup()}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OAuthOnboardingPage;
