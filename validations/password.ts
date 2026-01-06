import { RegisterOptions } from "react-hook-form";
import { LoginFormData } from "@/app/(auth)/login/page";

export const passwordRules: RegisterOptions<LoginFormData, "password"> = {
  required: "비밀번호를 입력해주세요.",
  minLength: {
    value: 6,
    message: "올바른 이메일 형식을 입력해주세요.",
  },
};
