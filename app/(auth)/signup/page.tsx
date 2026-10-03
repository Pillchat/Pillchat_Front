"use client";

import { PUBLIC_ASSETS } from "@/constants/assets";

import { FC, useEffect, useState } from "react";
import { useRouter } from "@/lib/navigation";
import {
  Step,
  useStep,
  useVerify,
  useCheckVerify,
  TERMS_TEXT,
  PRIVACY_TEXT,
} from "./_hooks";
import { useManualSubmit } from "./_hooks/useManualSubmit";

import { SolidButton } from "@/components/atoms";
import { Button } from "@/components/ui/button";
import { StepHeader, IconInputField } from "@/components/molecules";
import type { SignupGrade, SignupSource } from "@/constants/signup";
import {
  clearSignupDraft,
  getSignupDraft,
  saveSignupDraft,
} from "@/lib/client/signupDraft";
import { FcGoogle } from "react-icons/fc";
import { RiKakaoTalkFill } from "react-icons/ri";
import Image from "next/image";
import { useGoogleOAuth, useKakaoOAuth } from "../login/_hooks";
import { VerifyInputField } from "./_components/VerifyInputField";
import { SignupInfoFlow } from "./_components/SignupInfoFlow";

export type SignupFormData = {
  email: string;
  password: string;
  nickname: string;
  agreeToTerms: boolean;
  code?: string;
};

const SignupPage: FC = () => {
  const { step, setStep, nextStep, prevStep } = useStep();
  const { onVerify, isLoading: isVerifyLoading, isVerified } = useVerify();
  const { onCheckVerify } = useCheckVerify();

  // 수동 회원가입 훅 사용
  const { onSubmit, isLoading: isSubmitLoading } = useManualSubmit();

  const [checkedTerms, setCheckedTerms] = useState(false);
  const [checkedPrivacy, setCheckedPrivacy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordRe, setShowPasswordRe] = useState(false);
  const router = useRouter();

  // 공통
  const [realName, setRealName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordRe, setPasswordRe] = useState("");
  const [nickname, setNickname] = useState("");
  const [code, setCode] = useState("");

  // 학생용
  const [university, setUniversity] = useState("");
  const [grade, setGrade] = useState<SignupGrade | "">("");
  const [signupSource, setSignupSource] = useState<SignupSource | "">("");

  const { startGoogleLogin, isGoogleLoginLoading, googleLoginError } =
    useGoogleOAuth(true);
  const { startKakaoLogin, isKakaoLoginLoading, kakaoLoginError } =
    useKakaoOAuth(true);
  const oauthError = googleLoginError || kakaoLoginError;

  const leaveSignup = () => {
    clearSignupDraft();
    router.push("/login");
  };

  useEffect(() => {
    const draft = getSignupDraft();
    if (!draft) return;

    setRealName(draft.realName);
    setNickname(draft.nickname);
    setGrade(draft.grade);
    setUniversity(draft.university);
    setSignupSource(draft.signupSource);
    setCheckedTerms(draft.agreeToTerms);
    setCheckedPrivacy(draft.agreeToPrivacy);
    setStep(Step.AuthMethod);
  }, [setStep]);

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleVerify = async () => {
    if (!email) return;
    await onVerify(email);
  };

  const handleCheckVerify = async () => {
    if (!email || !code) return;
    const result = await onCheckVerify(email, code);

    if (result.status === 200) {
      nextStep();
    } else if (result.status === 400) {
      alert("인증코드가 잘못되었습니다.");
      setCode("");
    } else {
      alert(result.message || "인증에 실패했습니다.");
    }
  };

  const handleResendCode = async () => {
    if (!email) return;
    await onVerify(email);
  };

  const isValidNickname = (nickname: string) =>
    /^[가-힣A-Za-z0-9]{2,}$/.test(nickname.trim());

  const isManualInfoValid = Boolean(
    realName.trim() && isValidNickname(nickname) && grade && signupSource,
  );

  const persistSignupDraft = () => {
    if (!grade || !signupSource || !isManualInfoValid) return false;

    saveSignupDraft({
      realName: realName.trim(),
      nickname: nickname.trim(),
      grade,
      university: university.trim(),
      signupSource,
      agreeToTerms: checkedTerms,
      agreeToPrivacy: checkedPrivacy,
    });
    return true;
  };

  const startGoogleSignup = () => {
    if (!persistSignupDraft()) return;
    startGoogleLogin();
  };

  const startKakaoSignup = () => {
    if (!persistSignupDraft()) return;
    startKakaoLogin();
  };

  const isSignupReady = Boolean(
    isManualInfoValid &&
      isValidEmail(email) &&
      code.trim() &&
      password.length >= 8 &&
      passwordRe === password &&
      checkedTerms &&
      checkedPrivacy,
  );

  const handleSubmit = async () => {
    if (!isSignupReady || !grade || !signupSource) {
      alert("모든 필수 정보를 입력해주세요.");
      return;
    }

    if (!isValidNickname(nickname)) {
      alert("닉네임은 한글, 영문, 숫자만 사용해 2자 이상 입력해주세요.");
      return;
    }

    await onSubmit({
      email,
      password,
      nickname: nickname.trim(),
      agreeToTerms: true,
      realName: realName.trim(),
      documentType: "student",
      university: university.trim(),
      grade,
      signupSource,
    });
  };

  return (
    <div className="flex min-h-dvh flex-col items-center">
      {/* OCR 관련 단계(Guide, Ocr)는 수동 가입에서 사용하지 않으므로 제거 
         Step.DepartMent 단계를 "정보 수동 입력" 단계로 재사용합니다.
      */}

      {step === Step.DepartMent && (
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
          onExit={leaveSignup}
          onComplete={nextStep}
        />
      )}

      {/* 서비스 이용약관 동의 (ServiceRule) */}
      {step === Step.ServiceRule && (
        <div className="flex w-full flex-1 flex-col">
          <StepHeader content="서비스 이용약관" onIconClick={prevStep} />

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
              aria-pressed={checkedTerms}
              className="mt-[1rem] flex flex-row items-center justify-center gap-[0.15rem]"
              onClick={() => setCheckedTerms(!checkedTerms)}
            >
              <Image
                className="h-[26px] w-[26px]"
                width={26}
                height={26}
                src={
                  checkedTerms
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
                variant={checkedTerms ? "brand" : "disabled"}
                disabled={!checkedTerms}
                onClick={() => nextStep()}
              />
            </div>
          </div>
        </div>
      )}

      {/* 개인정보 처리방침 동의 (PrivacyPolicy) */}
      {step === Step.PrivacyPolicy && (
        <div className="flex w-full flex-1 flex-col">
          <StepHeader content="개인정보 처리방침" onIconClick={prevStep} />

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
              aria-pressed={checkedPrivacy}
              className="mt-[1rem] flex flex-row items-center justify-center gap-[0.15rem]"
              onClick={() => setCheckedPrivacy(!checkedPrivacy)}
            >
              <Image
                className="h-[26px] w-[26px]"
                width={26}
                height={26}
                src={
                  checkedPrivacy
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

            <div className="font-regular mt-[1rem] w-[90%]">
              <SolidButton
                content="다음"
                variant={checkedPrivacy ? "brand" : "disabled"}
                disabled={!checkedPrivacy}
                onClick={() => nextStep()}
              />
            </div>
          </div>
        </div>
      )}

      {step === Step.AuthMethod && (
        <>
          <StepHeader content="회원가입" onIconClick={prevStep} />

          <div className="mt-[3rem] flex w-[90%] flex-col gap-[20px]">
            <div className="flex flex-col gap-2">
              <p className="text-xl font-semibold">가입 방법을 선택해주세요.</p>
              <p className="text-sm text-muted-foreground">
                선택한 방법으로 계정이 만들어집니다.
              </p>
            </div>

            {oauthError && (
              <p className="text-center text-sm text-destructive">
                {oauthError}
              </p>
            )}

            <div className="mt-[1rem] flex flex-col gap-[15px]">
              <Button
                type="button"
                variant="outline"
                className="h-[3.625rem] w-full rounded-xl border-border bg-white text-label-large text-foreground shadow-none active:bg-secondary"
                disabled={isGoogleLoginLoading || isKakaoLoginLoading}
                onClick={startGoogleSignup}
              >
                <FcGoogle className="!size-5" />
                Google로 가입하기
              </Button>

              <Button
                type="button"
                variant="outline"
                className="h-[3.625rem] w-full rounded-xl border-[#FEE500] bg-[#FEE500] text-label-large text-[#191919] shadow-none active:bg-[#F7DC00]"
                disabled={isGoogleLoginLoading || isKakaoLoginLoading}
                onClick={startKakaoSignup}
              >
                <RiKakaoTalkFill className="!size-5 text-[#191919]" />
                카카오로 가입하기
              </Button>

              <div className="flex items-center gap-3 py-1">
                <div className="h-px flex-1 bg-muted" />
                <span className="text-xs font-medium text-muted-foreground">
                  또는
                </span>
                <div className="h-px flex-1 bg-muted" />
              </div>

              <SolidButton
                content="이메일로 가입하기"
                disabled={isGoogleLoginLoading || isKakaoLoginLoading}
                onClick={() => {
                  clearSignupDraft();
                  nextStep();
                }}
              />
            </div>
          </div>
        </>
      )}

      {/* 이메일 인증 (Email) */}
      {step === Step.Email && (
        <>
          <StepHeader content="회원가입" onIconClick={prevStep} />

          <div className="mt-[2rem] flex w-[90%] flex-col gap-[20px]">
            <p className="text-xl font-semibold">이메일을 입력해주세요.</p>

            <IconInputField
              content="이메일"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              placeholder="이메일을 적어주세요"
              autoFocus={true}
            />

            {!isVerified ? (
              <>
                <VerifyInputField
                  content="이메일 인증"
                  placeholder="인증번호를 적어주세요"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  api={handleVerify}
                />
                <SolidButton
                  content="인증번호 받기"
                  variant={email ? "brand" : "disabled"}
                  disabled={isVerifyLoading}
                  onClick={() => handleVerify()}
                />
              </>
            ) : (
              <>
                <VerifyInputField
                  content="인증번호"
                  placeholder="인증번호를 적어주세요"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  api={handleResendCode}
                />
                <SolidButton
                  content="인증하기"
                  variant={isValidEmail(email) ? "brand" : "disabled"}
                  disabled={!isValidEmail(email) || isVerifyLoading}
                  onClick={() => {
                    handleCheckVerify();
                  }}
                />
              </>
            )}
          </div>
        </>
      )}

      {/* 비밀번호 입력 (Password) */}
      {step === Step.Password && (
        <>
          <StepHeader content="회원가입" onIconClick={prevStep} />

          <div className="mt-[2rem] flex w-[90%] flex-col gap-[20px]">
            <p className="text-xl font-semibold">비밀번호를 입력해주세요.</p>

            <div className="flex flex-col gap-[5px]">
              <IconInputField
                content="비밀번호"
                iconAsButton={true}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onIconClick={() => setShowPassword(!showPassword)}
                iconPosition="right"
                iconSrc={
                  showPassword
                    ? PUBLIC_ASSETS.icons.eyeOff
                    : PUBLIC_ASSETS.icons.eye
                }
                iconSize={20}
                placeholder="비밀번호를 적어주세요"
                autoFocus={true}
                type={showPassword ? "text" : "password"}
                minLength={8}
                // maxLength={8} // 8자 제한이 너무 짧을 수 있어 주석 처리 혹은 검토 필요
              />

              <p className="font-regular text-sm text-border">
                영어, 숫자, 특수문자를 조합한 최소 8자리
              </p>
            </div>

            {password.length >= 8 && (
              <div className="flex flex-col gap-[5px]">
                <IconInputField
                  content="비밀번호 확인"
                  iconAsButton={true}
                  value={passwordRe}
                  onChange={(e) => setPasswordRe(e.target.value)}
                  onIconClick={() => setShowPasswordRe(!showPasswordRe)}
                  iconPosition="right"
                  iconSrc={
                    showPasswordRe
                      ? PUBLIC_ASSETS.icons.eyeOff
                      : PUBLIC_ASSETS.icons.eye
                  }
                  iconSize={20}
                  placeholder="비밀번호를 적어주세요"
                  type={showPasswordRe ? "text" : "password"}
                  minLength={8}
                />

                <p className="font-regular text-sm text-border">
                  비밀번호를 한 번 더 입력해주세요.
                </p>
              </div>
            )}

            <div className="mt-[4rem]">
              <SolidButton
                content={isSubmitLoading ? "가입 중..." : "완료"}
                variant={isSignupReady ? "brand" : "disabled"}
                disabled={!isSignupReady || isSubmitLoading}
                onClick={async () => {
                  await handleSubmit();
                }}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default SignupPage;
