"use client";

import { ChangeEvent, useState } from "react";
import { useRouter } from "@/lib/navigation";
import { fetchAPI } from "@/lib/functions";
import { Input, SolidButton } from "@/components/atoms";
import {
  IconInputField,
  StepHeader,
  SubmitModal,
} from "@/components/molecules";
import { Button } from "@/components/ui/button";

type Step = "verify" | "reset";

const FindPage = () => {
  const router = useRouter();

  const [step, setStep] = useState<Step>("verify");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState("");
  const [verificationError, setVerificationError] = useState("");

  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [showPasswordConfirmField, setShowPasswordConfirmField] =
    useState(false);
  const [passwordResetError, setPasswordResetError] = useState("");
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);

  const isValidEmail = email.trim().includes("@") && email.trim().includes(".");
  const isValidPassword = password.length >= 8;
  const isPasswordMatch =
    passwordConfirm.length > 0 && password === passwordConfirm;

  const resetVerificationState = () => {
    setIsCodeSent(false);
    setCode("");
    setVerificationMessage("");
    setVerificationError("");
  };

  const handleBack = () => {
    if (step === "verify") {
      router.back();
      return;
    }

    if (showPasswordConfirmField) {
      setShowPasswordConfirmField(false);
      setPasswordConfirm("");
      setPasswordResetError("");
      return;
    }

    setStep("verify");
    setPasswordResetError("");
  };

  const handleEmailChange = (e: ChangeEvent<HTMLInputElement>) => {
    const nextEmail = e.target.value;

    if (nextEmail !== email && (isCodeSent || code)) {
      resetVerificationState();
    }

    setEmail(nextEmail);
  };

  const handleSendCode = async () => {
    if (!isValidEmail || isSendingCode) return;

    setIsSendingCode(true);
    setVerificationMessage("");
    setVerificationError("");

    try {
      await fetchAPI("/api/auth/password-reset/send", "POST", {
        email: email.trim(),
      });

      setIsCodeSent(true);
      setCode("");
      setVerificationMessage("인증번호를 전송했습니다.");
    } catch (error: any) {
      console.error("비밀번호 재설정 인증번호 발송 실패:", error);
      setVerificationError(
        error.message || "인증번호 발송에 실패했습니다. 다시 시도해주세요.",
      );
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!isCodeSent || !code.trim() || isVerifyingCode) return;

    setIsVerifyingCode(true);
    setVerificationMessage("");
    setVerificationError("");

    try {
      const response = await fetch("/api/auth/password-reset/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          code: code.trim(),
        }),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          result.message || result.error || "인증번호 확인에 실패했습니다.",
        );
      }

      setStep("reset");
    } catch (error: any) {
      console.error("비밀번호 재설정 인증번호 확인 실패:", error);
      setVerificationError(error.message || "인증번호가 일치하지 않습니다.");
    } finally {
      setIsVerifyingCode(false);
    }
  };

  const handlePasswordChange = (e: ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    setPasswordResetError("");

    if (showPasswordConfirmField && passwordConfirm) {
      setPasswordConfirm("");
    }
  };

  const handlePasswordNext = () => {
    if (!isValidPassword) return;
    setShowPasswordConfirmField(true);
  };

  const handlePasswordConfirm = async () => {
    if (!isPasswordMatch || isResettingPassword) return;

    setIsResettingPassword(true);
    setPasswordResetError("");

    try {
      await fetchAPI("/api/auth/password-reset", "POST", {
        email: email.trim(),
        newPassword: password,
      });

      setIsSubmitModalOpen(true);
    } catch (error: any) {
      console.error("비밀번호 재설정 실패:", error);
      setPasswordResetError(
        error.message || "비밀번호 재설정에 실패했습니다. 다시 시도해주세요.",
      );
    } finally {
      setIsResettingPassword(false);
    }
  };

  const handlePasswordSubmit = () => {
    setIsSubmitModalOpen(false);
    router.push("/login");
  };

  const verifyButtonDisabled = !isCodeSent
    ? !isValidEmail || isSendingCode
    : !code.trim() || isVerifyingCode;
  const passwordButtonDisabled = !showPasswordConfirmField
    ? !isValidPassword
    : !isPasswordMatch || isResettingPassword;

  return (
    <div className="min-h-[100dvh] bg-white">
      <StepHeader
        content={step === "verify" ? "비밀번호 찾기" : "비밀번호 재설정"}
        onIconClick={handleBack}
      />

      <div className="mx-auto flex min-h-[calc(100dvh-60px)] w-[90%] flex-col pt-[2rem]">
        {step === "verify" ? (
          <>
            <div className="flex flex-col gap-[20px]">
              <p className="text-xl font-semibold">
                가입했던 이메일을 입력해주세요.
              </p>

              <IconInputField
                content="이메일"
                value={email}
                onChange={handleEmailChange}
                onIconClick={() => {
                  setEmail("");
                  resetVerificationState();
                }}
                type="email"
                iconAsButton={Boolean(email)}
                iconPosition="right"
                iconSrc={email ? "/Cancel.svg" : undefined}
                iconSize={20}
                placeholder="이메일을 입력해주세요."
                autoFocus
              />

              <div className="flex flex-col gap-[4px]">
                <p className="text-sm">인증번호</p>

                <div className="flex flex-row gap-[10px]">
                  <div className="w-[70%]">
                    <Input
                      value={code}
                      placeholder="인증번호를 입력해주세요."
                      disabled={!isCodeSent}
                      maxLength={6}
                      onChange={(e) => {
                        setCode(e.target.value.replace(/\D/g, ""));
                        setVerificationError("");
                      }}
                    />
                  </div>

                  <Button
                    type="button"
                    variant={isCodeSent ? "stroke-brand" : "disabled"}
                    disabled={!isCodeSent || isSendingCode}
                    className="h-[52px] w-[30%] rounded-[12px] px-0 text-[15px] font-medium"
                    onClick={handleSendCode}
                  >
                    {isSendingCode ? "전송 중" : "재전송"}
                  </Button>
                </div>

                {verificationMessage && (
                  <p className="text-xs text-[#2F6BFF]">
                    {verificationMessage}
                  </p>
                )}

                {verificationError && (
                  <p className="text-xs text-destructive">
                    {verificationError}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-auto pb-[calc(env(safe-area-inset-bottom)+2.5rem)] pt-[3rem]">
              <SolidButton
                content={
                  !isCodeSent
                    ? isSendingCode
                      ? "전송 중..."
                      : "인증번호 받기"
                    : isVerifyingCode
                      ? "확인 중..."
                      : "다음"
                }
                variant={verifyButtonDisabled ? "disabled" : "brand"}
                disabled={verifyButtonDisabled}
                onClick={isCodeSent ? handleVerifyCode : handleSendCode}
                className="text-[#999]"
              />
            </div>
          </>
        ) : (
          <>
            <div className="flex flex-col gap-[20px]">
              <p className="text-xl font-semibold">
                새 비밀번호를 입력해주세요.
              </p>

              <div className="flex flex-col gap-[5px]">
                <IconInputField
                  content="비밀번호"
                  iconAsButton
                  value={password}
                  onChange={handlePasswordChange}
                  onIconClick={() => setShowPassword((prev) => !prev)}
                  iconPosition="right"
                  iconSrc={showPassword ? "/OpenEye.svg" : "/ClosedEye.svg"}
                  iconSize={20}
                  placeholder="비밀번호를 입력해주세요."
                  autoFocus
                  type={showPassword ? "text" : "password"}
                  minLength={8}
                />

                <p className="text-sm text-border">
                  영어, 숫자, 특수문자를 조합한 최소 8자리
                </p>
              </div>

              {showPasswordConfirmField && (
                <div className="flex flex-col gap-[5px]">
                  <IconInputField
                    content="비밀번호 확인"
                    iconAsButton
                    value={passwordConfirm}
                    onChange={(e) => {
                      setPasswordConfirm(e.target.value);
                      setPasswordResetError("");
                    }}
                    onIconClick={() => setShowPasswordConfirm((prev) => !prev)}
                    iconPosition="right"
                    iconSrc={
                      showPasswordConfirm ? "/OpenEye.svg" : "/ClosedEye.svg"
                    }
                    iconSize={20}
                    placeholder="비밀번호를 한 번 더 입력해주세요."
                    type={showPasswordConfirm ? "text" : "password"}
                    minLength={8}
                    inputClassName={
                      passwordConfirm && !isPasswordMatch
                        ? "border-destructive focus:ring-0"
                        : undefined
                    }
                  />

                  <p
                    className={`text-sm ${
                      passwordConfirm && !isPasswordMatch
                        ? "text-destructive"
                        : "text-border"
                    }`}
                  >
                    비밀번호를 한 번 더 입력해주세요.
                  </p>
                </div>
              )}

              {passwordResetError && (
                <p className="text-sm text-destructive">{passwordResetError}</p>
              )}
            </div>

            <div className="mt-auto pb-[calc(env(safe-area-inset-bottom)+2.5rem)] pt-[3rem]">
              <SolidButton
                content={
                  showPasswordConfirmField
                    ? isResettingPassword
                      ? "처리 중..."
                      : "확인"
                    : "다음"
                }
                variant={passwordButtonDisabled ? "disabled" : "brand"}
                disabled={passwordButtonDisabled}
                onClick={
                  showPasswordConfirmField
                    ? handlePasswordConfirm
                    : handlePasswordNext
                }
              />
            </div>
          </>
        )}
      </div>

      <SubmitModal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        onConfirm={handlePasswordSubmit}
        title="비밀번호 재설정 완료"
        message1="재설정한 비밀번호로 다시 로그인해주세요."
      />
    </div>
  );
};

export default FindPage;
