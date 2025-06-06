"use client";

import { useAtom } from "jotai";
import {
  buttonLabelAtom,
  currentStepAtom,
  selectedSubjectsAtom,
} from "@/lib/atoms/onboarding";
import { Button } from "@/components/ui/button";
import { FC, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";

const TOTAL_STEPS = 4;

export const OnboardingFooter: FC = () => {
  const router = useRouter();

  const [label, setLabel] = useAtom(buttonLabelAtom);
  const [selectedSubjects] = useAtom(selectedSubjectsAtom);
  const [currentStep, setCurrentStep] = useAtom(currentStepAtom);

  // const isDisabled = currentStep === 1 && selectedSubjects.length < 5;
  // console.log(isDisabled);

  const handleClick = () => {
    // API 테스트 호출
    // mutate();

    if (currentStep < TOTAL_STEPS) {
      setCurrentStep((prev) => prev + 1);
      return;
    }
    router.push("/login");
  };

  useEffect(() => {
    setLabel(currentStep < TOTAL_STEPS ? "다음" : "로그인 화면으로 가기");
  }, [currentStep, setLabel]);

  return (
    <footer className="flex flex-col gap-2 p-4">
      {currentStep < TOTAL_STEPS && (
        <p className="text-center text-xs text-muted-foreground">
          선택한 항목은 마이페이지에서 변경 가능합니다.
        </p>
      )}
      <Button
        // variant={isDisabled ? "disabled" : "default"}
        size="lg"
        className="h-14 w-full"
        // disabled={isDisabled}
        onClick={handleClick}
      >
        {label}
      </Button>
    </footer>
  );
};
