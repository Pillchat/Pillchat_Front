import { atom } from "jotai";
import { OnboardingProfessional } from "@/types/onboarding";

// Professional 온보딩 정보 atom
export const professionalInfoAtom = atom<OnboardingProfessional>({
  strongSubjects: [],
  job: "",
  workplace: "",
  availableDays: [],
  availableTimes: [],
  answerCycle: "",
  avgAnswerCount: 0,
});
