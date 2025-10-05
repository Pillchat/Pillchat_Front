"use client";

import { useAtom } from "jotai";
import {
  buttonLabelAtom,
  currentStepAtom,
  studentInfoAtom,
  professionalInfoAtom,
} from "@/lib/atoms/onboarding";
import { Button } from "@/components/ui/button";
import { FC, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { fetchAPI } from "@/lib/functions";

type OnboardingFooterProps = {
  role?: string;
};

export const OnboardingFooter: FC<OnboardingFooterProps> = ({ role }) => {
  const router = useRouter();
  const params = useParams();
  const currentRole = role || params.role;

  const [label, setLabel] = useAtom(buttonLabelAtom);
  const [currentStep, setCurrentStep] = useAtom(currentStepAtom);
  const [studentInfo] = useAtom(studentInfoAtom);
  const [professionalInfo] = useAtom(professionalInfoAtom);

  // API 호출을 위한 mutation
  const { mutate, isPending } = useMutation({
    mutationFn: async (onboardingData: any) => {
      const endpoint = `/api/onboarding/${currentRole}`;
      const response = await fetchAPI(endpoint, "PUT", onboardingData);

      return response.data;
    },
    onSuccess: () => {
      router.push("/login");
    },
    onError: (error) => {
      console.error("온보딩 API 에러:", error);
    },
  });

  // role별 최종 단계 정의
  const getFinalStep = () => (currentRole === "student" ? 4 : 3);

  const handleClick = () => {
    console.log("handleClick called - currentStep:", currentStep);

    const finalStep = getFinalStep();

    // 최종 단계에서 API 호출
    if (currentStep === finalStep) {
      console.log(`Final step (${finalStep}) reached - calling API`);
      const onboardingData = prepareOnboardingData();
      console.log("Onboarding data:", onboardingData);
      mutate(onboardingData);
      return;
    }

    // 다음 단계로 이동
    if (currentStep < finalStep) {
      setCurrentStep((prev) => prev + 1);
      return;
    }
  };

  // role에 따라 온보딩 데이터 준비
  const prepareOnboardingData = () => {
    if (currentRole === "student") {
      return studentInfo;
    } else {
      return professionalInfo;
    }
  };

  useEffect(() => {
    const finalStep = getFinalStep();
    setLabel(currentStep === finalStep ? "로그인 화면으로 가기" : "다음");
  }, [currentStep, setLabel, currentRole]);

  return (
    <footer className="flex flex-col gap-2 p-4">
      {currentStep < getFinalStep() && (
        <p className="text-center text-xs text-muted-foreground">
          선택한 항목은 마이페이지에서 변경 가능합니다.
        </p>
      )}
      <Button
        size="lg"
        className="h-14 w-full"
        disabled={isPending}
        onClick={handleClick}
      >
        {isPending ? "처리 중..." : label}
      </Button>
    </footer>
  );
};
