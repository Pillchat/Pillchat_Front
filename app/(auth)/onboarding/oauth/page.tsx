"use client";

import { RoleCard, SolidButton, StrokeButton } from "@/components/atoms";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { IconInputField, StepHeader } from "@/components/molecules";
import { useAuth } from "@/hooks";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  clearPendingOAuthSignup,
  getPendingOAuthSignup,
  type PendingOAuthSignup,
} from "../../login/_utils/oauthSignup";

type OAuthSignupStep = "role" | "info" | "nickname";
type OAuthSignupRole = "student" | "professional";

const isValidNickname = (nickname: string) =>
  /^[가-힣A-Za-z0-9]{2,}$/.test(nickname.trim());

const isValidStudentId = (value: string) => /^\d{8,14}$/.test(value);

const getProviderLabel = (provider?: string) =>
  provider === "kakao" ? "카카오" : "Google";

const OAuthOnboardingPage = () => {
  const router = useRouter();
  const { saveTokensAndSetupRefresh } = useAuth();
  const [pendingSignup, setPendingSignup] = useState<PendingOAuthSignup | null>(
    null,
  );
  const [step, setStep] = useState<OAuthSignupStep>("role");
  const [role, setRole] = useState<OAuthSignupRole | "">("");
  const [realName, setRealName] = useState("");
  const [nickname, setNickname] = useState("");
  const [university, setUniversity] = useState("");
  const [department, setDepartment] = useState("");
  const [studentId, setStudentId] = useState("");
  const [grade, setGrade] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [issueDate, setIssueDate] = useState("");
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

    setPendingSignup(session);
    setRealName(session.name ?? "");
  }, [router]);

  const providerLabel = getProviderLabel(pendingSignup?.provider);

  const isInfoValid = useMemo(() => {
    if (!realName.trim() || !role) return false;

    if (role === "student") {
      return Boolean(university.trim() && isValidStudentId(studentId));
    }

    return Boolean(licenseNumber.trim());
  }, [licenseNumber, realName, role, studentId, university]);

  const isSubmitValid =
    isValidNickname(nickname) && agreeToTerms && agreeToPrivacy;

  const goBack = () => {
    setError(null);

    if (step === "role") {
      clearPendingOAuthSignup();
      router.replace("/login");
      return;
    }

    if (step === "info") {
      setStep("role");
      return;
    }

    setStep("info");
  };

  const handleCompleteSignup = async () => {
    if (!pendingSignup || !role || !isSubmitValid) return;

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
          documentType: role,
          nickname: nickname.trim(),
          realName: realName.trim(),
          agreeToTerms,
          agreeToPrivacy,
          ...(role === "student"
            ? {
                university: university.trim(),
                department: department.trim(),
                studentId,
                grade: grade.trim(),
              }
            : {
                licenseNumber: licenseNumber.trim(),
                issueDate: issueDate.trim(),
              }),
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

      {step === "role" && (
        <div className="flex w-full flex-1 flex-col items-center px-6">
          <div className="mt-[5rem] text-xl font-semibold">
            <p>현재 어떤 직종에 일하고 계신가요?</p>
          </div>

          <div className="mt-5 flex flex-row gap-[15px]">
            <RoleCard
              title="학생"
              imageSrc="/illustrations/Student.svg"
              onClick={() => {
                setRole("student");
                setStep("info");
              }}
            />

            <RoleCard
              title="전문가"
              imageSrc="/illustrations/Specialist.svg"
              onClick={() => {
                setRole("professional");
                setStep("info");
              }}
            />
          </div>
        </div>
      )}

      {step === "info" && (
        <div className="mt-[1rem] flex w-[90%] flex-col gap-[20px]">
          <p className="text-xl font-semibold">
            {role === "student" ? "학생" : "전문가"} 정보를 입력해주세요.
          </p>

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

          {role === "student" ? (
            <>
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
                onChange={(e) =>
                  setStudentId(e.target.value.replace(/\D/g, ""))
                }
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
            </>
          ) : (
            <>
              <IconInputField
                content="면허번호"
                value={licenseNumber}
                onChange={(e) => setLicenseNumber(e.target.value)}
                onIconClick={() => setLicenseNumber("")}
                placeholder="12345"
                iconSrc="/icons/Cancel.svg"
                iconAsButton
                iconSize={20}
              />
              <IconInputField
                content="발급일 (선택)"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                onIconClick={() => setIssueDate("")}
                placeholder="YYYY-MM-DD"
                iconSrc="/icons/Cancel.svg"
                iconAsButton
                iconSize={20}
              />
            </>
          )}

          <div className="mt-[2rem] flex w-full flex-col justify-center gap-[15px]">
            <StrokeButton
              content="이전으로"
              variant="stroke-brand"
              onClick={() => setStep("role")}
            />
            <SolidButton
              content="다음"
              variant={isInfoValid ? "brand" : "disabled"}
              disabled={!isInfoValid}
              onClick={() => setStep("nickname")}
            />
          </div>
        </div>
      )}

      {step === "nickname" && (
        <div className="mt-[2rem] flex w-[90%] flex-col gap-[20px]">
          <p className="text-xl font-semibold">
            필챗에서 활동할 닉네임을 입력해주세요.
          </p>

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

          <div className="mt-[5rem] flex flex-col gap-[15px]">
            <Button
              type="button"
              variant="stroke-brand"
              className="h-[52px] w-full rounded-xl bg-white text-[1.125rem] font-medium"
              onClick={() => setStep("info")}
            >
              이전으로
            </Button>
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
