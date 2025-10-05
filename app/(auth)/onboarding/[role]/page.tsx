"use client";

import { OnboardingFooter, OnboardingHeader } from "@/components/molecules";
import {
  OnboardingComplete,
  SelectAnswerFrequency,
  SelectPersonalInfo,
  SelectSubject,
  SelectSubjectByGrade,
} from "@/components/organisms";
import { currentStepAtom } from "@/lib/atoms";
import { getCurrentUserInfo } from "@/lib/functions";
import { useAtom } from "jotai";
import { useParams, useRouter } from "next/navigation";
import { FC, useState, useEffect } from "react";

const OnboardingForRolePage: FC = () => {
  const router = useRouter();
  const { role } = useParams();
  const [currentStep] = useAtom(currentStepAtom);
  const [username, setUsername] = useState<string>("회원");

  const TOTAL_STEPS = role === "student" ? 5 : 4;

  useEffect(() => {
    const userInfo = getCurrentUserInfo();
    setUsername(userInfo?.username ?? "회원");
  }, []);

  const renderContent = (role) => {
    switch (currentStep) {
      case 1:
        return role === "professional" ? (
          <SelectSubject role={role} username={username} />
        ) : (
          <SelectPersonalInfo role={role} username={username} />
        );
      case 2:
        return role === "professional" ? (
          <SelectPersonalInfo role={role} username={username} />
        ) : (
          <SelectSubject role={role} username={username} />
        );
      case 3:
        return role === "professional" ? (
          <SelectAnswerFrequency username={username} />
        ) : (
          <SelectSubject role={role} username={username} />
        );
      case 4:
        return role === "professional" ? (
          <OnboardingComplete role="professional" />
        ) : (
          <SelectSubjectByGrade username={username} />
        );
      case 5:
        return <OnboardingComplete role="student" />;
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
      <OnboardingFooter role={role as string} />
    </div>
  );
};

export default OnboardingForRolePage;
