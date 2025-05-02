"use client";

import { RoundedCheckbox, Logo, TextInput } from "@/components/atoms";
import { Button } from "@/components/ui/button";
import { Label } from "@radix-ui/react-label";
import React, { FC } from "react";

//컴포넌트 분리 필요

const LoginPage: FC = () => {
  return (
    <div className="flex h-screen flex-col items-center justify-evenly">
      <Logo />
      <div className="flex w-full flex-col gap-8">
        <div className="flex flex-col gap-4">
          <TextInput label="이메일" placeholder="이메일을 입력해주세요" />
          <TextInput
            label="비밀번호"
            placeholder="비밀번호를 입력해주세요"
            type="password"
          />
          <div className="flex items-center gap-2">
            <RoundedCheckbox id="remember-me" className="h-5 w-5" />
            <Label
              htmlFor="remember-me"
              className="text-sm font-medium text-button-foreground"
            >
              자동로그인
            </Label>
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <Button className="w-full" variant="disabled" size="default">
            다음
          </Button>
          <div className="flex flex-row justify-between">
            <p className="text-sm font-medium text-muted-foreground">
              아이디찾기 | 비밀번호찾기
            </p>
            <p className="text-sm font-medium text-muted-foreground">
              회원가입
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
