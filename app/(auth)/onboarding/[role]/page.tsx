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
import { getCurrentUserInfo, fetchAPI } from "@/lib/functions";
import { useAtom } from "jotai";
import { useParams, useRouter } from "next/navigation";
import { FC, useEffect, useMemo, useState } from "react";

type Opt = {
  label: string;
  value: string;
  selected: boolean;
  timeRange?: string;
};

type Category = {
  categoryName: string;
  subjects: Opt[];
};

type ProfessionalFormData = {
  page1: { categories: Category[] };
  page2: { availableDays: Opt[]; availableTimes: Opt[] };
  page3: { answerCycles: Opt[]; avgAnswerCount: number };
  page4: { jobs: Opt[]; workplace: string };
};

type StudentFormData = {
  page1: {
    grades: Opt[];
    age: number;
    studyDays: Opt[];
    studyTimes: Opt[];
  };
  page2: { categories: Category[] };
  page3: { categories: Category[] };
  page4: {
    courses: Array<{
      year: number;
      categories: Category[];
      customSubjects: string[];
    }>;
  };
};

type OnboardingFormData = ProfessionalFormData | StudentFormData;

const OnboardingForRolePage: FC = () => {
  const router = useRouter();
  const { role } = useParams<{ role: string }>();
  const [currentStep, setCurrentStep] = useAtom(currentStepAtom);
  const [username, setUsername] = useState<string>("회원");
  const [professionalPrefill, setProfessionalPrefill] =
    useState<OnboardingFormData | null>(null);

  const TOTAL_STEPS = role === "student" ? 5 : 4;

  useEffect(() => {
    const userInfo = getCurrentUserInfo();
    setUsername(userInfo?.username ?? "회원");
  }, []);

  useEffect(() => {
    const run = async () => {
      const response = (await fetchAPI(
        `/api/onboarding/${role}/form-data`,
        "GET",
      )) as OnboardingFormData;
      setProfessionalPrefill(response);
    };

    if (role === "student" || role === "professional") run();
  }, [role]);

  const onBack = () => {
    if (currentStep === 1) {
      router.replace("/mypage");
      return;
    }
    setCurrentStep((s) => Math.max(1, s - 1));
  };

  const professionalData =
    role === "professional"
      ? (professionalPrefill as ProfessionalFormData | null)
      : null;

  const studentData =
    role === "student" ? (professionalPrefill as StudentFormData | null) : null;

  const prefillStrongSubjects = useMemo(() => {
    const subjects =
      professionalData?.page1?.categories?.flatMap((c) => c.subjects) ?? [];
    return subjects
      .filter((s) => s.selected)
      .map((s) => s.value)
      .slice(0, 5);
  }, [professionalData]);

  const renderContent = (role: string) => {
    switch (currentStep) {
      case 1:
        return role === "professional" ? (
          <SelectSubject
            role={role}
            username={username}
            prefillStrongSubjects={prefillStrongSubjects}
            prefillFormData={professionalData}
          />
        ) : (
          <SelectPersonalInfo
            role={role}
            username={username}
            professionalPrefill={studentData}
          />
        );

      case 2:
        return role === "professional" ? (
          <SelectPersonalInfo
            role={role}
            username={username}
            professionalPrefill={professionalData}
          />
        ) : (
          <SelectSubject
            role={role}
            username={username}
            prefillFormData={{
              page1: { categories: studentData?.page3?.categories ?? [] },
            }}
          />
        );

      case 3:
        return role === "professional" ? (
          <SelectAnswerFrequency
            username={username}
            professionalPrefill={professionalData}
          />
        ) : (
          <SelectSubject
            role={role}
            username={username}
            prefillFormData={{
              page1: { categories: studentData?.page2?.categories ?? [] },
            }}
          />
        );

      case 4:
        return role === "professional" ? (
          <OnboardingComplete role="professional" />
        ) : (
          <SelectSubjectByGrade
            username={username}
            professionalPrefill={studentData}
          />
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
          onSkip={() => router.push("/login")}
          onBack={onBack}
        />
      )}
      <div
        className={`mx-6 flex flex-grow flex-col ${
          currentStep >= TOTAL_STEPS ? "justify-center" : ""
        }`}
      >
        {renderContent(role)}
      </div>
      <OnboardingFooter
        role={role as string}
        professionalPrefill={professionalPrefill}
      />
    </div>
  );
};

export default OnboardingForRolePage;
