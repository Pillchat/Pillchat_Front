"use client";

import { SolidButton } from "@/components/atoms";
import { IconInputField } from "@/components/molecules";
import {
  SIGNUP_GRADE_OPTIONS,
  SIGNUP_SOURCE_OPTIONS,
  type SignupGrade,
  type SignupSource,
} from "@/constants/signup";
import { cn } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";

type SignupInfoStage = 1 | 2 | 3 | 4;

type SignupInfoFlowProps = {
  realName: string;
  nickname: string;
  grade: SignupGrade | "";
  university: string;
  signupSource: SignupSource | "";
  onRealNameChange: (value: string) => void;
  onNicknameChange: (value: string) => void;
  onGradeChange: (value: SignupGrade) => void;
  onUniversityChange: (value: string) => void;
  onSignupSourceChange: (value: SignupSource) => void;
  onExit: () => void;
  onComplete: () => void | Promise<void>;
  completeLabel?: string;
  isCompleting?: boolean;
  error?: string | null;
};

const PROGRESS_WIDTH: Record<SignupInfoStage, string> = {
  1: "w-1/4",
  2: "w-2/4",
  3: "w-3/4",
  4: "w-full",
};

const isValidNickname = (nickname: string) =>
  /^[가-힣A-Za-z0-9]{2,}$/.test(nickname.trim());

export function SignupInfoFlow({
  realName,
  nickname,
  grade,
  university,
  signupSource,
  onRealNameChange,
  onNicknameChange,
  onGradeChange,
  onUniversityChange,
  onSignupSourceChange,
  onExit,
  onComplete,
  completeLabel = "다음",
  isCompleting = false,
  error,
}: SignupInfoFlowProps) {
  const [stage, setStage] = useState<SignupInfoStage>(1);

  const isIdentityValid = Boolean(realName.trim() && isValidNickname(nickname));
  const canContinue =
    stage === 1
      ? isIdentityValid
      : stage === 2
        ? Boolean(grade)
        : stage === 3
          ? Boolean(university.trim())
          : Boolean(signupSource);

  const goBack = () => {
    if (stage === 1) {
      onExit();
      return;
    }

    setStage((currentStage) => (currentStage - 1) as SignupInfoStage);
  };

  const goNext = () => {
    if (!canContinue || isCompleting) return;

    if (stage === 4) {
      void onComplete();
      return;
    }

    setStage((currentStage) => (currentStage + 1) as SignupInfoStage);
  };

  const skipUniversity = () => {
    onUniversityChange("");
    setStage(4);
  };

  return (
    <div className="flex min-h-dvh w-full flex-col bg-background">
      <header className="px-6 pt-[calc(1.25rem+env(safe-area-inset-top))]">
        <button
          type="button"
          aria-label="이전 단계로"
          className="flex h-10 w-10 items-center justify-start text-foreground"
          onClick={goBack}
        >
          <ArrowLeft aria-hidden="true" className="h-8 w-8" strokeWidth={1.8} />
        </button>

        <div className="mt-5 h-2 w-full overflow-hidden rounded-full bg-primary-900">
          <div
            className={cn(
              "h-full rounded-full bg-primary transition-[width] duration-300",
              PROGRESS_WIDTH[stage],
            )}
          />
        </div>
      </header>

      <main className="flex-1 px-6 pb-36 pt-7">
        {stage === 1 && (
          <section>
            <h1 className="text-headline-large text-foreground">
              기본 정보를 입력해 주세요
            </h1>
            <p className="mt-2 text-body-large text-muted-foreground">
              필챗에서 사용할 실명과 닉네임이에요.
            </p>

            <div className="mt-10 flex flex-col gap-5">
              <IconInputField
                content="성명 (실명)"
                value={realName}
                onChange={(event) => onRealNameChange(event.target.value)}
                placeholder="홍길동"
              />
              <div className="flex flex-col gap-1">
                <IconInputField
                  content="닉네임"
                  value={nickname}
                  onChange={(event) => onNicknameChange(event.target.value)}
                  placeholder="필챗러"
                />
                <p className="text-label-small text-muted-foreground">
                  한글, 영문, 숫자만 사용한 2자 이상
                </p>
              </div>
            </div>
          </section>
        )}

        {stage === 2 && (
          <section>
            <h1 className="text-headline-large text-foreground">
              학년을 선택해 주세요
            </h1>
            <p className="mt-2 text-body-large text-muted-foreground">
              학년에 맞는 콘텐츠를 제공해요.
            </p>

            <div className="mt-10 grid grid-cols-3 gap-3">
              {SIGNUP_GRADE_OPTIONS.map((option) => {
                const isSelected = grade === option;

                return (
                  <button
                    key={option}
                    type="button"
                    aria-pressed={isSelected}
                    className={cn(
                      "flex min-h-[7.5rem] items-center justify-center rounded-3xl border bg-card px-2 text-center text-title-large text-muted-foreground transition-colors",
                      isSelected
                        ? "border-primary bg-primary-980 text-primary"
                        : "border-border",
                    )}
                    onClick={() => onGradeChange(option)}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {stage === 3 && (
          <section>
            <h1 className="text-headline-large text-foreground">
              학교를 알려 주세요
            </h1>
            <p className="mt-2 text-body-large text-muted-foreground">
              학교 정보는 선택 사항이에요.
            </p>

            <div className="mt-10">
              <IconInputField
                content="학교명"
                value={university}
                onChange={(event) => onUniversityChange(event.target.value)}
                placeholder="ex) 한국대학교"
              />
            </div>
          </section>
        )}

        {stage === 4 && (
          <section>
            <h1 className="text-headline-large text-foreground">
              필챗을 어떻게 알게 되셨나요?
            </h1>
            <p className="mt-2 text-body-large text-muted-foreground">
              서비스 개선을 위해 가입 경로를 알려 주세요.
            </p>

            <div className="mt-10 grid grid-cols-2 gap-3">
              {SIGNUP_SOURCE_OPTIONS.map((option) => {
                const isSelected = signupSource === option;

                return (
                  <button
                    key={option}
                    type="button"
                    aria-pressed={isSelected}
                    className={cn(
                      "flex min-h-[5.5rem] items-center justify-center rounded-3xl border bg-card px-3 text-center text-title-medium text-muted-foreground transition-colors",
                      isSelected
                        ? "border-primary bg-primary-980 text-primary"
                        : "border-border",
                    )}
                    onClick={() => onSignupSourceChange(option)}
                  >
                    {option}
                  </button>
                );
              })}
            </div>

            {error && (
              <p className="mt-5 text-body-small text-primary">{error}</p>
            )}
          </section>
        )}
      </main>

      <div className="fixed bottom-0 left-1/2 z-10 flex w-full max-w-app -translate-x-1/2 flex-col gap-3 bg-gradient-to-t from-background via-background to-transparent px-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-8">
        {stage === 3 && (
          <button
            type="button"
            className="w-full text-center text-title-small text-primary underline underline-offset-4"
            onClick={skipUniversity}
          >
            건너뛰기
          </button>
        )}
        <SolidButton
          content={
            isCompleting && stage === 4
              ? "가입 중..."
              : stage === 4
                ? completeLabel
                : "다음"
          }
          variant={canContinue && !isCompleting ? "brand" : "disabled"}
          disabled={!canContinue || isCompleting}
          onClick={goNext}
        />
      </div>
    </div>
  );
}
