"use client";

import { SolidButton, StrokeButton } from "@/components/atoms";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { IconInputField, StepHeader } from "@/components/molecules";
import { useAuth } from "@/hooks";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  clearPendingOAuthSignup,
  getPendingOAuthSignup,
  type PendingOAuthSignup,
} from "../../login/_utils/oauthSignup";

type OAuthSignupStep = "profile" | "school" | "terms";

const isValidNickname = (nickname: string) =>
  /^[가-힣A-Za-z0-9]{2,}$/.test(nickname.trim());

const isValidStudentId = (value: string) => /^\d{8,14}$/.test(value);

const getProviderLabel = (provider?: string) =>
  provider === "kakao" ? "카카오" : "Google";

const createPreviewSignup = (): PendingOAuthSignup => ({
  provider: "google",
  oauthSignupToken: "local-preview-token",
  rememberMe: false,
  email: "preview@example.com",
  name: "홍길동",
});

const OAuthOnboardingPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { saveTokensAndSetupRefresh } = useAuth();
  const isPreview =
    process.env.NODE_ENV !== "production" &&
    searchParams.get("preview") === "1";
  const previewSignup = useMemo(
    () => (isPreview ? createPreviewSignup() : null),
    [isPreview],
  );
  const [pendingSignup, setPendingSignup] = useState<PendingOAuthSignup | null>(
    previewSignup,
  );
  const [step, setStep] = useState<OAuthSignupStep>("profile");
  const [realName, setRealName] = useState(previewSignup?.name ?? "");
  const [nickname, setNickname] = useState("");
  const [university, setUniversity] = useState("");
  const [department, setDepartment] = useState("");
  const [studentId, setStudentId] = useState("");
  const [grade, setGrade] = useState("");
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [agreeToPrivacy, setAgreeToPrivacy] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const session = getPendingOAuthSignup();

    if (!session && previewSignup) {
      setPendingSignup(previewSignup);
      setRealName(previewSignup.name ?? "");
      return;
    }

    if (!session) {
      router.replace("/login");
      return;
    }

    setPendingSignup(session);
    setRealName(session.name ?? "");
  }, [previewSignup, router]);

  const providerLabel = getProviderLabel(pendingSignup?.provider);

  const isProfileValid = useMemo(() => {
    return Boolean(realName.trim() && isValidNickname(nickname));
  }, [nickname, realName]);

  const isSchoolValid = useMemo(() => {
    return Boolean(university.trim() && isValidStudentId(studentId));
  }, [studentId, university]);

  const isSubmitValid =
    isProfileValid && isSchoolValid && agreeToTerms && agreeToPrivacy;

  const goBack = () => {
    setError(null);

    if (step === "profile") {
      clearPendingOAuthSignup();
      router.replace("/login");
      return;
    }

    if (step === "school") {
      setStep("profile");
      return;
    }

    setStep("school");
  };

  const handleCompleteSignup = async () => {
    if (!pendingSignup || !isSubmitValid) return;

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
          department: department.trim(),
          studentId,
          grade: grade.trim(),
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
      router.replace("/");
    } catch (error: any) {
      setError(error.message || "OAuth 회원가입에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!pendingSignup) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-muted-foreground">불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center">
      <StepHeader content={`${providerLabel} 회원가입`} onIconClick={goBack} />

      {step === "profile" && (
        <div className="mt-[1rem] flex w-[90%] flex-1 flex-col gap-[20px]">
          <div className="flex items-center gap-2">
            <div className="h-1.5 flex-1 rounded-full bg-primary" />
            <div className="h-1.5 flex-1 rounded-full bg-gray-200" />
            <div className="h-1.5 flex-1 rounded-full bg-gray-200" />
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-xl font-semibold">
              이름과 닉네임을 입력해주세요.
            </p>
            <p className="text-sm text-border">
              닉네임은 필챗에서 활동할 때 보여요.
            </p>
          </div>

          {pendingSignup.email && (
            <IconInputField
              content={`${providerLabel} 계정`}
              value={pendingSignup.email}
              disabled
            />
          )}

          <IconInputField
            content="성명 (실명)"
            value={realName}
            onChange={(e) => setRealName(e.target.value)}
            onIconClick={() => setRealName("")}
            placeholder="홍길동"
            iconSrc="/icons/Cancel.svg"
            iconAsButton
            iconSize={20}
          />

          <div className="flex flex-col gap-[5px]">
            <IconInputField
              content="닉네임"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              onIconClick={() => setNickname("")}
              placeholder="닉네임을 적어주세요"
              iconSrc="/icons/Cancel.svg"
              iconAsButton
              iconSize={20}
              errorMessage={
                nickname && !isValidNickname(nickname)
                  ? "닉네임은 한글, 영문, 숫자만 사용해 2자 이상 입력해주세요."
                  : undefined
              }
            />
            <p className="text-sm text-border">
              한글, 영문, 숫자만 사용한 2자 이상
            </p>
          </div>

          <div className="mt-auto flex w-full flex-col justify-center gap-[15px] pb-14">
            <StrokeButton
              content="이전으로"
              variant="stroke-brand"
              onClick={goBack}
            />
            <SolidButton
              content="다음"
              variant={isProfileValid ? "brand" : "disabled"}
              disabled={!isProfileValid}
              onClick={() => setStep("school")}
            />
          </div>
        </div>
      )}

      {step === "school" && (
        <div className="mt-[1rem] flex w-[90%] flex-1 flex-col gap-[20px]">
          <div className="flex items-center gap-2">
            <div className="h-1.5 flex-1 rounded-full bg-gray-200" />
            <div className="h-1.5 flex-1 rounded-full bg-primary" />
            <div className="h-1.5 flex-1 rounded-full bg-gray-200" />
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-xl font-semibold">학교 정보를 입력해주세요.</p>
            <p className="text-sm text-border">
              학교명과 학번은 필수로 입력해주세요.
            </p>
          </div>

          <IconInputField
            content="학교명"
            value={university}
            onChange={(e) => setUniversity(e.target.value)}
            onIconClick={() => setUniversity("")}
            placeholder="한국대학교"
            iconSrc="/icons/Cancel.svg"
            iconAsButton
            iconSize={20}
          />
          <IconInputField
            content="학과"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            onIconClick={() => setDepartment("")}
            placeholder="약학과"
            iconSrc="/icons/Cancel.svg"
            iconAsButton
            iconSize={20}
          />
          <IconInputField
            content="학번"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value.replace(/\D/g, ""))}
            onIconClick={() => setStudentId("")}
            placeholder="20241234"
            iconSrc="/icons/Cancel.svg"
            iconAsButton
            iconSize={20}
            type="text"
            maxLength={14}
            inputMode="numeric"
            errorMessage={
              studentId && !isValidStudentId(studentId)
                ? "학번은 숫자 8~14자로 입력해주세요."
                : undefined
            }
          />
          <IconInputField
            content="학년 (선택)"
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
            onIconClick={() => setGrade("")}
            placeholder="1학년"
            iconSrc="/icons/Cancel.svg"
            iconAsButton
            iconSize={20}
          />

          <div className="mt-[2rem] flex w-full flex-col justify-center gap-[15px]">
            <StrokeButton
              content="이전으로"
              variant="stroke-brand"
              onClick={goBack}
            />
            <SolidButton
              content="다음"
              variant={isSchoolValid ? "brand" : "disabled"}
              disabled={!isSchoolValid}
              onClick={() => setStep("terms")}
            />
          </div>
        </div>
      )}

      {step === "terms" && (
        <div className="mt-[2rem] flex w-[90%] flex-1 flex-col gap-[20px]">
          <div className="flex items-center gap-2">
            <div className="h-1.5 flex-1 rounded-full bg-gray-200" />
            <div className="h-1.5 flex-1 rounded-full bg-gray-200" />
            <div className="h-1.5 flex-1 rounded-full bg-primary" />
          </div>

          <p className="text-xl font-semibold">약관에 동의해주세요.</p>

          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Checkbox
                id="oauth-agree-terms"
                checked={agreeToTerms}
                onCheckedChange={(checked) => setAgreeToTerms(checked === true)}
              />
              <Label
                htmlFor="oauth-agree-terms"
                className="text-sm font-medium text-button-foreground"
              >
                서비스 이용약관에 동의합니다.
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="oauth-agree-privacy"
                checked={agreeToPrivacy}
                onCheckedChange={(checked) =>
                  setAgreeToPrivacy(checked === true)
                }
              />
              <Label
                htmlFor="oauth-agree-privacy"
                className="text-sm font-medium text-button-foreground"
              >
                개인정보 처리방침에 동의합니다.
              </Label>
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="mt-auto flex flex-col gap-[15px] pb-14">
            <StrokeButton
              content="이전으로"
              variant="stroke-brand"
              onClick={() => setStep("school")}
            />
            <SolidButton
              content={isSubmitting ? "가입 중..." : "완료"}
              variant={isSubmitValid && !isSubmitting ? "brand" : "disabled"}
              disabled={!isSubmitValid || isSubmitting}
              onClick={handleCompleteSignup}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default OAuthOnboardingPage;
