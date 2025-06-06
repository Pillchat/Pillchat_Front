"use client";

import { OnboardingFooter, OnboardingHeader } from "@/components/molecules";
import {
  OnboardingComplete,
  SelectAnswerFrequency,
  SelectPersonalInfo,
  SelectSubject,
} from "@/components/organisms";
import { currentStepAtom } from "@/lib/atoms";
import { useAtom } from "jotai";
import { useParams, useRouter } from "next/navigation";
import { FC } from "react";

const TOTAL_STEPS = 4;

const OnboardingForRolePage: FC = () => {
  const router = useRouter();
  const { role } = useParams();
  const [currentStep] = useAtom(currentStepAtom);

  const renderContent = (role) => {
    switch (currentStep) {
      case 1:
        return role === "professional" ? (
          <SelectSubject role={role} />
        ) : (
          <SelectPersonalInfo role={role} />
        );
      case 2:
        return role === "professional" ? (
          <SelectPersonalInfo role={role} />
        ) : (
          <SelectSubject role={role} />
        );
      case 3:
        return role === "professional" ? (
          <SelectAnswerFrequency />
        ) : (
          <SelectSubject role={role} />
        );
      case 4:
        return <OnboardingComplete role={role} />;
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      {currentStep < TOTAL_STEPS && (
        <OnboardingHeader
          step={currentStep}
          totalSteps={TOTAL_STEPS}
          onSkip={() => {
            router.push("/login");
          }}
        />
      )}
      <div
        className={`mx-6 flex flex-grow flex-col ${
          currentStep >= TOTAL_STEPS ? "justify-center" : ""
        }`}
      >
        {renderContent(role)}
      </div>
      <OnboardingFooter />
    </div>
  );
};

export default OnboardingForRolePage;
