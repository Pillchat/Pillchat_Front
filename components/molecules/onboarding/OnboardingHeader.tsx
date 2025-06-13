"use client";

import { LeftArrowButton, TextButton } from "@/components/atoms";
import { currentStepAtom } from "@/lib/atoms";
import { useAtom } from "jotai";

interface OnboardingHeaderProps {
  step: number;
  totalSteps: number;
  showSkip?: boolean;
  onSkip?: () => void;
}

export const OnboardingHeader = ({
  step,
  totalSteps,
  showSkip = true,
  onSkip,
}: OnboardingHeaderProps) => {
  const [, setCurrentStep] = useAtom(currentStepAtom);

  return (
    <header className="flex items-center justify-between px-6 py-4">
      <LeftArrowButton
        onClick={() => {
          setCurrentStep((prev) => prev - 1);
        }}
      />
      <p className="text-lg font-bold">
        {step}/{totalSteps - 1}
      </p>
      {showSkip ? (
        <TextButton
          label="건너뛰기"
          variant="textOnly"
          onClick={onSkip}
          className="text-md p-0 text-gray-500"
        />
      ) : (
        <div className="w-10" /> // 공간 확보용
      )}
    </header>
  );
};
