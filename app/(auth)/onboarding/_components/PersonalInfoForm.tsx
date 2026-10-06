"use client";

import { SolidButton } from "@/components/atoms/SolidButton";
import { Input } from "@/components/ui/input";
import {
  SIGNUP_GRADE_OPTIONS,
  SIGNUP_SOURCE_OPTIONS,
  isSignupGrade,
  isSignupSource,
} from "@/constants/signup";
import { cn } from "@/lib/utils";
import type { PersonalInfoValues } from "@/types/personalInfo";
import { type FormEvent, useId } from "react";

export type { PersonalInfoValues } from "@/types/personalInfo";

type PersonalInfoFormProps = {
  values: PersonalInfoValues;
  onChange: (values: PersonalInfoValues) => void;
  onSave: () => void;
  saving: boolean;
  error?: string | null;
};

export function PersonalInfoForm({
  values,
  onChange,
  onSave,
  saving,
  error,
}: PersonalInfoFormProps) {
  const id = useId();
  const isNicknameValid =
    /^[가-힣A-Za-z0-9]{2,}$/.test(values.nickname.trim()) &&
    values.nickname.trim().length <= 50;
  const hasNicknameError = Boolean(values.nickname) && !isNicknameValid;
  const canSave = Boolean(
    values.realName.trim() &&
      values.realName.trim().length <= 50 &&
      isNicknameValid &&
      isSignupGrade(values.grade) &&
      values.university.trim().length <= 255 &&
      isSignupSource(values.signupSource),
  );

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSave || saving) return;
    onSave();
  };

  return (
    <form
      noValidate
      onSubmit={handleSubmit}
      aria-busy={saving || undefined}
      className="pb-[calc(9rem+env(safe-area-inset-bottom))]"
    >
      <p className="text-body-medium text-muted-foreground">
        회원가입 때 입력한 정보를 확인하고 수정해 주세요.
        <br />
        학교를 제외한 항목은 필수 정보예요.
      </p>

      <fieldset disabled={saving} className="mt-8 flex min-w-0 flex-col gap-8">
        <fieldset className="min-w-0">
          <legend className="text-headline-small text-foreground">
            기본 정보
          </legend>
          <div className="mt-4 flex flex-col gap-5">
            <div className="flex flex-col gap-1">
              <label
                htmlFor={`${id}-real-name`}
                className="text-title-small text-foreground"
              >
                성명 (실명)
              </label>
              <Input
                id={`${id}-real-name`}
                name="realName"
                autoComplete="name"
                required
                maxLength={50}
                value={values.realName}
                onChange={(event) =>
                  onChange({ ...values, realName: event.target.value })
                }
                placeholder="홍길동"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label
                htmlFor={`${id}-nickname`}
                className="text-title-small text-foreground"
              >
                닉네임
              </label>
              <Input
                id={`${id}-nickname`}
                name="nickname"
                autoComplete="nickname"
                required
                minLength={2}
                maxLength={50}
                pattern="[가-힣A-Za-z0-9]{2,}"
                value={values.nickname}
                onChange={(event) =>
                  onChange({ ...values, nickname: event.target.value })
                }
                placeholder="필챗러"
                error={hasNicknameError}
                aria-invalid={hasNicknameError || undefined}
                aria-describedby={`${id}-nickname-help`}
              />
              <p
                id={`${id}-nickname-help`}
                className={cn(
                  "text-label-small",
                  hasNicknameError ? "text-primary" : "text-muted-foreground",
                )}
              >
                한글, 영문, 숫자만 사용한 2자 이상
              </p>
            </div>
          </div>
        </fieldset>

        <fieldset className="min-w-0">
          <legend className="text-headline-small text-foreground">
            학년 / 상태
          </legend>
          <p className="mt-1 text-body-medium text-muted-foreground">
            현재 학년이나 상태를 선택해 주세요.
          </p>
          <div className="mt-4 grid grid-cols-3 gap-4">
            {SIGNUP_GRADE_OPTIONS.map((option) => {
              const isSelected = values.grade === option;

              return (
                <button
                  key={option}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => onChange({ ...values, grade: option })}
                  className={cn(
                    "flex min-h-[3.625rem] items-center justify-center rounded-xl border px-2 py-3 text-center text-title-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60",
                    isSelected
                      ? "border-primary bg-primary-980 text-primary"
                      : "border-gray-300 bg-card text-muted-foreground enabled:hover:border-primary-800",
                  )}
                >
                  {option}
                </button>
              );
            })}
          </div>
        </fieldset>

        <div className="flex flex-col gap-1">
          <label
            htmlFor={`${id}-university`}
            className="text-headline-small text-foreground"
          >
            학교{" "}
            <span className="text-title-small text-muted-foreground">
              (선택)
            </span>
          </label>
          <p
            id={`${id}-university-help`}
            className="text-body-medium text-muted-foreground"
          >
            학교 정보는 입력하지 않아도 저장할 수 있어요.
          </p>
          <Input
            id={`${id}-university`}
            name="university"
            maxLength={255}
            className="mt-3"
            value={values.university}
            onChange={(event) =>
              onChange({ ...values, university: event.target.value })
            }
            placeholder="ex) 한국대학교"
            aria-describedby={`${id}-university-help`}
          />
        </div>

        <fieldset className="min-w-0">
          <legend className="text-headline-small text-foreground">
            가입 경로
          </legend>
          <p className="mt-1 text-body-medium text-muted-foreground">
            필챗을 어떻게 알게 되셨나요?
          </p>
          <div className="mt-4 grid grid-cols-2 gap-4">
            {SIGNUP_SOURCE_OPTIONS.map((option) => {
              const isSelected = values.signupSource === option;

              return (
                <button
                  key={option}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => onChange({ ...values, signupSource: option })}
                  className={cn(
                    "flex min-h-[3.625rem] items-center justify-center rounded-xl border px-3 py-3 text-center text-title-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60",
                    isSelected
                      ? "border-primary bg-primary-980 text-primary"
                      : "border-gray-300 bg-card text-muted-foreground enabled:hover:border-primary-800",
                  )}
                >
                  {option}
                </button>
              );
            })}
          </div>
        </fieldset>
      </fieldset>

      {error ? (
        <p role="alert" className="mt-5 text-body-small text-primary">
          {error}
        </p>
      ) : null}

      <div className="fixed bottom-0 left-1/2 z-10 w-full max-w-app -translate-x-1/2 bg-gradient-to-t from-background via-background to-transparent px-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-8">
        <SolidButton
          type="submit"
          content={saving ? "저장 중..." : "변경 저장"}
          loading={saving}
          variant={canSave && !saving ? "brand" : "disabled"}
          disabled={!canSave || saving}
        />
      </div>
    </form>
  );
}
