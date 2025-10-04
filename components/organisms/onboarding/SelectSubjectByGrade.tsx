"use client";

import { SectionWithChips } from "@/components/molecules";
import { studentInfoAtom } from "@/lib/atoms/onboarding";
import { useSubjects, useCustomSubjects } from "@/hooks";
import { useAtom } from "jotai";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { RoundedInput, TextButton } from "@/components/atoms";
import { REGISTRATION_STATUS } from "@/constants";
import { useMemo } from "react";
import { filter, omit } from "lodash";
export const SelectSubjectByGrade = ({ username }) => {
  const [studentInfo, setStudentInfo] = useAtom(studentInfoAtom);
  const { subjects, isLoading, getSubjectMapForChips, getSubjectCodeByLabel } =
    useSubjects();

  const yearList = useMemo(
    () =>
      filter(
        REGISTRATION_STATUS,
        (year) => year !== "휴학생" && year !== "졸업생",
      ),
    [],
  );

  const {
    removeCustomSubject,
    toggleInput,
    updateInputValue,
    handleInputSubmit,
    handleInputBlur,
    getCustomSubjectsForYear,
    getInputState,
  } = useCustomSubjects();

  // 학년 문자열을 숫자로 변환하는 헬퍼 함수
  const convertYearToNumber = (yearString: string): number => {
    return parseInt(yearString.replace("학년", ""), 10);
  };

  // 특정 학년의 과목 데이터 가져오기
  const getCourseDataForYear = (year: string) => {
    const yearNumber = convertYearToNumber(year);
    return (
      studentInfo.courses.find((course) => course.year === yearNumber) || {
        year: yearNumber,
        subjects: [],
        customSubjects: [],
      }
    );
  };

  // 과목 선택/해제 핸들러
  const handleSubjectToggle = (year: string, subjectCode: string) => {
    const yearNumber = convertYearToNumber(year);
    const updatedCourses = studentInfo.courses.map((course) => {
      if (course.year === yearNumber) {
        const isSelected = course.subjects.includes(subjectCode);
        return {
          ...course,
          subjects: isSelected
            ? course.subjects.filter((code) => code !== subjectCode)
            : [...course.subjects, subjectCode],
        };
      }
      return course;
    });

    // 해당 학년의 course가 없으면 새로 생성
    if (!studentInfo.courses.find((course) => course.year === yearNumber)) {
      updatedCourses.push({
        year: yearNumber,
        subjects: [subjectCode],
        customSubjects: [],
      });
    }

    setStudentInfo({ ...studentInfo, courses: updatedCourses });
  };

  // 과목 데이터를 칩 형태로 변환
  const subjectMapForChips = getSubjectMapForChips();

  // API 데이터가 로딩 중일 때
  if (isLoading) {
    return <div>과목 정보를 불러오는 중...</div>;
  }

  return (
    <>
      <p className="my-5 text-xl font-semibold">
        {username}님의
        <br />
        수강과목을 골라주세요.
      </p>
      <Accordion type="single" collapsible className="w-full">
        {yearList.map((year, index) => {
          const courseData = getCourseDataForYear(year);
          const selectedSubjectLabels = courseData.subjects
            .map((code) => {
              if (!subjects) return null;
              for (const section of subjects) {
                const item = section.items.find((item) => item.code === code);
                if (item) return item.label;
              }
              return null;
            })
            .filter(Boolean) as string[];

          const customSubjects = getCustomSubjectsForYear(year);
          const generalInputState = getInputState(year, "general");
          const majorInputState = getInputState(year, "major");

          return (
            <AccordionItem key={year} value={`item-${index + 1}`}>
              <AccordionTrigger>
                <p>{year}</p>
              </AccordionTrigger>
              <AccordionContent className="flex flex-col gap-6">
                <SectionWithChips
                  data={subjectMapForChips}
                  selectedItems={selectedSubjectLabels}
                  onItemToggle={(subjectLabel: string) => {
                    const subjectCode = getSubjectCodeByLabel(subjectLabel);
                    if (subjectCode) {
                      handleSubjectToggle(year, subjectCode);
                    }
                  }}
                />

                {/* 교양과목 추가 섹션 */}
                <div className="flex flex-col gap-2">
                  <p className="text-xl font-semibold">
                    교양과목을 추가하세요.
                  </p>
                  <div className="flex items-center gap-2">
                    {/* 추가된 교양과목 칩들 */}
                    {customSubjects.general.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {customSubjects.general.map((subject, subjectIndex) => (
                          <div
                            key={subjectIndex}
                            className="inline-flex h-8 items-center gap-1 rounded-full border border-primary bg-white py-1 pl-3 pr-1 text-sm text-primary"
                          >
                            <span>{subject}</span>
                            <button
                              onClick={() =>
                                removeCustomSubject(year, subject, "general")
                              }
                              className="ml-1 w-5 rounded-full bg-[#FFD1CC] text-primary hover:text-primary/70"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {!generalInputState.isVisible ? (
                      <TextButton
                        className="gap-0 pr-0"
                        label="추가하기"
                        afterIcon={<img src="/CirclePlus.svg" alt="plus" />}
                        variant="outline"
                        size="sm"
                        onClick={() => toggleInput(year, "general", true)}
                      />
                    ) : (
                      <RoundedInput
                        value={generalInputState.value}
                        onChange={(e) =>
                          updateInputValue(year, "general", e.target.value)
                        }
                        onKeyDown={(e) => handleInputSubmit(e, year, "general")}
                        onBlur={() => handleInputBlur(year, "general")}
                        autoFocus
                      />
                    )}
                  </div>
                </div>

                {/* 전공과목 추가 섹션 */}
                <div className="flex flex-col gap-2">
                  <p className="text-xl font-semibold">
                    전공필수/전공선택 과목을 추가하세요.
                  </p>
                  <div className="flex items-center gap-2">
                    {/* 추가된 전공과목 칩들 */}
                    {customSubjects.major.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {customSubjects.major.map((subject, subjectIndex) => (
                          <div
                            key={subjectIndex}
                            className="inline-flex h-8 items-center gap-1 rounded-full border border-primary bg-white py-1 pl-3 pr-1 text-sm text-primary"
                          >
                            <span>{subject}</span>
                            <button
                              onClick={() =>
                                removeCustomSubject(year, subject, "major")
                              }
                              className="ml-1 w-5 rounded-full bg-[#FFD1CC] text-primary hover:text-primary/70"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div>
                      {!majorInputState.isVisible ? (
                        <TextButton
                          className="gap-0 pr-0"
                          label="추가하기"
                          afterIcon={<img src="/CirclePlus.svg" alt="plus" />}
                          variant="outline"
                          size="sm"
                          onClick={() => toggleInput(year, "major", true)}
                        />
                      ) : (
                        <RoundedInput
                          value={majorInputState.value}
                          onChange={(e) =>
                            updateInputValue(year, "major", e.target.value)
                          }
                          onKeyDown={(e) => handleInputSubmit(e, year, "major")}
                          onBlur={() => handleInputBlur(year, "major")}
                          autoFocus
                        />
                      )}
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </>
  );
};
