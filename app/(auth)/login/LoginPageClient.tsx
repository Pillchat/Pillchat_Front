"use client";

import { PUBLIC_ASSETS } from "@/constants/assets";
import { Logo } from "@/components/atoms";
import { Button } from "@/components/ui/button";
import { Label } from "@radix-ui/react-label";
import { type FC, useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useRouter } from "@/lib/navigation";
import { Checkbox } from "@/components/ui/checkbox";
import { useGoogleOAuth, useKakaoOAuth, useSubmit } from "./_hooks";
import { IconInputField } from "@/components/molecules";
import { emailRules, passwordRules } from "@/validations";
import { getRefreshToken, getToken, refreshTokens } from "@/lib/client/fetch";
import { isTokenExpired } from "@/lib/functions";
import { FcGoogle } from "react-icons/fc";
import { RiKakaoTalkFill } from "react-icons/ri";
import type { LoginFormData } from "./types";
import { clearSignupDraft } from "@/lib/client/signupDraft";

export const LoginPageClient: FC = () => {
  const router = useRouter();
  const { onSubmit, isLoading, error: loginError } = useSubmit();
  const [eye, setEye] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors, isValid },
  } = useForm<LoginFormData>({
    mode: "onChange",
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });
  const rememberMe = watch("rememberMe");
  const { startGoogleLogin, isGoogleLoginLoading, googleLoginError } =
    useGoogleOAuth(rememberMe);
  const { startKakaoLogin, isKakaoLoginLoading, kakaoLoginError } =
    useKakaoOAuth(rememberMe);
  const authError = loginError || googleLoginError || kakaoLoginError;

  const startGoogleLoginFromLoginPage = () => {
    clearSignupDraft();
    startGoogleLogin();
  };

  const startKakaoLoginFromLoginPage = () => {
    clearSignupDraft();
    startKakaoLogin();
  };

  useEffect(() => {
    const restoreLogin = async () => {
      try {
        const token = getToken();
        if (token && !isTokenExpired(token)) {
          router.replace("/");
          return;
        }

        if (getRefreshToken()) {
          const refreshed = await refreshTokens();
          if (refreshed) {
            router.replace("/");
            return;
          }
        }
      } finally {
        setIsCheckingAuth(false);
      }
    };

    restoreLogin();
  }, [router]);

  return (
    <div className="login-page">
      <div className="login-shell">
        <div className="login-logo-section">
          <Logo />
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="login-form">
          <div className="login-fields">
            <Controller
              name="email"
              control={control}
              rules={emailRules}
              render={({ field }) => (
                <IconInputField
                  content="이메일"
                  placeholder="이메일을 입력해주세요"
                  {...field}
                />
              )}
            />

            <Controller
              name="password"
              control={control}
              rules={passwordRules}
              render={({ field }) => (
                <IconInputField
                  content="비밀번호"
                  placeholder="비밀번호를 입력해주세요"
                  type={eye ? "text" : "password"}
                  iconSrc={
                    eye ? PUBLIC_ASSETS.icons.eyeOff : PUBLIC_ASSETS.icons.eye
                  }
                  iconAlt="비밀번호 보기"
                  iconAsButton
                  iconSize={20}
                  onIconClick={() => setEye((prev) => !prev)}
                  errorMessage={errors.password?.message}
                  {...field}
                />
              )}
            />

            <Controller
              name="rememberMe"
              control={control}
              render={({ field: { value, onChange } }) => (
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="remember-me"
                    className="h-5 w-5 rounded-full border-[1.5px] border-border data-[state=checked]:border-primary data-[state=checked]:bg-primary"
                    checked={value}
                    onCheckedChange={onChange}
                  />
                  <Label
                    htmlFor="remember-me"
                    className="text-sm font-medium text-button-foreground"
                  >
                    자동로그인
                  </Label>
                </div>
              )}
            />
          </div>

          <div className="login-actions">
            {authError && (
              <p className="text-center text-sm text-destructive">
                {authError}
              </p>
            )}

            <Button
              type="submit"
              variant="brand"
              className="w-full"
              disabled={!isValid || isLoading || isCheckingAuth}
            >
              로그인
            </Button>

            <div className="flex items-center gap-3 py-1">
              <div className="h-px flex-1 bg-muted" />
              <span className="text-xs font-medium text-muted-foreground">
                또는
              </span>
              <div className="h-px flex-1 bg-muted" />
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full border-border bg-white text-base text-foreground shadow-none active:bg-secondary"
              disabled={
                isLoading ||
                isGoogleLoginLoading ||
                isKakaoLoginLoading ||
                isCheckingAuth
              }
              onClick={startGoogleLoginFromLoginPage}
            >
              <FcGoogle className="!size-5" />
              Google로 로그인
            </Button>

            <Button
              type="button"
              variant="outline"
              className="w-full border-[#FEE500] bg-[#FEE500] text-base text-[#191919] shadow-none active:bg-[#F7DC00]"
              disabled={
                isLoading ||
                isGoogleLoginLoading ||
                isKakaoLoginLoading ||
                isCheckingAuth
              }
              onClick={startKakaoLoginFromLoginPage}
            >
              <RiKakaoTalkFill className="!size-5 text-[#191919]" />
              카카오로 로그인
            </Button>

            <div className="login-footer-links">
              <p
                className="text-sm font-medium text-muted-foreground"
                onClick={() => router.push("/find")}
              >
                비밀번호 찾기
              </p>
              <p
                className="cursor-pointer text-sm font-medium text-muted-foreground"
                onClick={() => router.push("/signup")}
              >
                회원가입
              </p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
