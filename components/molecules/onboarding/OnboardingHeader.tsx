"use client";

import { LeftArrowButton, TextButton } from "@/components/atoms";

interface OnboardingHeaderProps {
  step: number;
  totalSteps: number;
  showSkip?: boolean;
  onSkip?: () => void;
  onBack?: () => void;
}

export const OnboardingHeader = ({
  step,
  totalSteps,
  showSkip = true,
  onSkip,
  onBack,
}: OnboardingHeaderProps) => {
  return (
    <>
      <header className="fixed left-1/2 top-0 z-50 flex h-[90px] w-full max-w-app -translate-x-1/2 items-center justify-between bg-white px-6 md:px-8">
        <LeftArrowButton onClick={onBack ?? (() => {})} />
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
          <div className="w-10" />
        )}
      </header>
      <div aria-hidden="true" className="h-[90px] shrink-0" />
    </>
  );
};
