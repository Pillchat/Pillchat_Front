"use client";

import { SectionWithChips } from "@/components/molecules";
import { SubjectMap } from "@/constants/subject";
import { currentStepAtom, selectedSubjectsAtom } from "@/lib/atoms";
import { useAtom } from "jotai";
import { filter, includes } from "lodash";

export const SelectSubject = ({ role }) => {
  const [selectedSubjects, setSelectedSubjects] = useAtom(selectedSubjectsAtom);
  const [currentStep] = useAtom(currentStepAtom);

  const handleSubjectToggle = (subject: string) => {
    setSelectedSubjects((prev) => {
      if (includes(prev, subject)) {
        return filter(prev, (s) => s !== subject);
      } else if (prev.length < 5) {
        return [...prev, subject];
      }
      return prev;
    });
  };

  return (
    <>
      <p className="my-5 text-xl font-semibold">
        {"name"}님이
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
        data={SubjectMap}
        selectedItems={selectedSubjects}
        onItemToggle={handleSubjectToggle}
        maxSelection={5}
      />
    </>
  );
};
