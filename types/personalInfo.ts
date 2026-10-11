import type { SignupGrade, SignupSource } from "@/constants/signup";

export interface PersonalInfoValues {
  realName: string;
  nickname: string;
  grade: SignupGrade | "";
  university: string;
  signupSource: SignupSource | "";
}

export interface PersonalInfoResponse {
  realName: string;
  nickname: string;
  grade: string | null;
  university: string | null;
  signupSource: string | null;
}
