"use client";

import { SectionWithChips } from "@/components/molecules";
import { currentStepAtom } from "@/lib/atoms/onboarding";
import { useSubjects, useOnboardingSubjects } from "@/hooks";
import { useAtom } from "jotai";

export const SelectSubject = ({ role, username }) => {
  const [currentStep] = useAtom(currentStepAtom);
  const { isLoading } = useSubjects();
  const { selectedSubjectLabels, subjectMapForChips, handleSubjectToggle } =
    useOnboardingSubjects(role, currentStep);

  // API 데이터가 로딩 중일 때
  if (isLoading) {
    return <div>과목 정보를 불러오는 중...</div>;
  }

  return (
    <>
      <p className="my-5 text-xl font-semibold">
        {username}님이
        <br />
        <span className="text-primary">
          {role === "professional"
            ? "자신있어 하는 과목"
            : currentStep === 2
              ? "어려워 하는 과목"
              : "자신있어 하는 과목"}
        </span>
        을 골라주세요. (최대 5개)
      </p>
      <SectionWithChips
        data={subjectMapForChips}
        selectedItems={selectedSubjectLabels}
        onItemToggle={handleSubjectToggle}
        maxSelection={5}
      />
    </>
  );
};
