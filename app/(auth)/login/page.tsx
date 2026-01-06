"use client";

import { Logo } from "@/components/atoms";
import { Button } from "@/components/ui/button";
import { Label } from "@radix-ui/react-label";
import { FC } from "react";
import { useForm, Controller } from "react-hook-form";
import { useRouter } from "next/navigation";
import { Checkbox } from "@/components/ui/checkbox";
import { useSubmit } from "./_hooks";
import { useState } from "react";
import { IconInputField } from "@/components/molecules";
import { emailRules, passwordRules } from "@/validations";

export type LoginFormData = {
  email: string;
  password: string;
  rememberMe: boolean;
};

const LoginPage: FC = () => {
  const router = useRouter();
  const { onSubmit, isLoading, error: loginError } = useSubmit();
  const [eye, setEye] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<LoginFormData>({
    mode: "onChange",
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  return (
    <div className="flex min-h-screen flex-col items-center justify-evenly px-6">
      <Logo />
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex w-full flex-col gap-8"
      >
        <div className="flex flex-col gap-4">
          <Controller
            name="email"
            control={control}
            rules={emailRules}
            render={({ field }) => (
              <IconInputField
                content="이메일"
                placeholder="이메일을 입력해주세요"
                errorMessage={errors.email?.message}
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
                iconSrc={eye ? "/ClosedEye.svg" : "/Eye.svg"}
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

        <div className="flex flex-col gap-3">
          {loginError && (
            <p className="text-center text-sm text-destructive">{loginError}</p>
          )}

          <Button className="w-full" disabled={!isValid || isLoading}>
            로그인
          </Button>

          <div className="flex flex-row justify-between">
            <p className="text-sm font-medium text-muted-foreground">
              아이디찾기 | 비밀번호찾기
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
  );
};

export default LoginPage;
