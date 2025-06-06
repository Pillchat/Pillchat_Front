"use client";

import { TextButton } from "@/components/atoms";
import { Button } from "@/components/ui/button";
import { currentStepAtom } from "@/lib/atoms";
import { useAtom } from "jotai";
import { useRouter } from "next/navigation";

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
  const router = useRouter();
  const [, setCurrentStep] = useAtom(currentStepAtom);

  return (
    <header className="flex items-center justify-between px-6 py-4">
      <Button
        variant="textOnly"
        size="icon"
        onClick={() => {
          setCurrentStep((prev) => prev - 1);
        }}
      >
        <img src="/ChevronLeft.svg" alt="arrow-left" width={32} height={32} />
      </Button>
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
