import { atom } from "jotai";
import { OnboardingStudent } from "@/types/onboarding";

// Student 온보딩 정보 atom
export const studentInfoAtom = atom<OnboardingStudent>({
  grade: "",
  age: 0,
  studyDays: [],
  studyTimes: [],
  weakSubjects: [],
  strongSubjects: [],
  courses: [],
});
