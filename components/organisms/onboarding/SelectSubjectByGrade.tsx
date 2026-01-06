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
import { useEffect, useMemo, useRef } from "react";
import { filter, includes } from "lodash";

type Opt = { label?: string; value?: string; selected?: boolean };
type Category = { categoryName: string; subjects: Opt[] };

type StudentFormData = {
  page4?: {
    courses?: Array<{
      year: number;
      categories?: Category[];
      subjects?: string[];
      customSubjects?: string[];
    }>;
  };
};

export const SelectSubjectByGrade = ({
  username,
  professionalPrefill,
}: {
  username: string;
  professionalPrefill?: StudentFormData | any;
}) => {
  const [studentInfo, setStudentInfo] = useAtom(studentInfoAtom);
  const { subjects, isLoading, getSubjectMapForChips, getSubjectCodeByLabel } =
    useSubjects();

  const didPrefill = useRef(false);

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

  const convertYearToNumber = (yearString: string): number => {
    return parseInt(yearString.replace("학년", ""), 10);
  };

  const getCourseDataForYear = (year: string) => {
    const yearNumber = convertYearToNumber(year);
    return (
      (studentInfo.courses ?? []).find((course: any) => course.year === yearNumber) || {
        year: yearNumber,
        subjects: [],
        customSubjects: [],
      }
    );
  };

  const handleSubjectToggle = (year: string, subjectValue: string) => {
  const yearNumber = convertYearToNumber(year);

  const updatedCourses = (studentInfo.courses ?? []).map((course: any) => {
    if (course.year === yearNumber) {
      const isSelected = (course.subjects ?? []).includes(subjectValue);
      return {
        ...course,
        subjects: isSelected
          ? (course.subjects ?? []).filter((v: string) => v !== subjectValue)
          : [...(course.subjects ?? []), subjectValue],
      };
    }
    return course;
  });

  if (!(studentInfo.courses ?? []).find((course: any) => course.year === yearNumber)) {
    updatedCourses.push({
      year: yearNumber,
      subjects: [subjectValue],
      customSubjects: [],
    });
  }

  setStudentInfo({ ...studentInfo, courses: updatedCourses });
};


  const subjectMapForChips = getSubjectMapForChips();

  const courseSubjectsFromServer = useMemo(() => {
  const raw =
    professionalPrefill?.page4?.courses ??
    professionalPrefill?.courses ??
    professionalPrefill?.page4?.selectedCourses;

  if (!Array.isArray(raw)) return [];

  return raw.flatMap((c: any) =>
    Array.isArray(c?.categories)
      ? c.categories.flatMap((cat: any) => (Array.isArray(cat?.subjects) ? cat.subjects : []))
      : [],
  );
}, [professionalPrefill]);

const labelToValue = useMemo(() => {
  const pairs: Array<[string, string]> = [];
  for (const s of courseSubjectsFromServer) {
    const l = String(s?.label ?? "");
    const v = String(s?.value ?? "");
    if (l && v) pairs.push([l, v]);
  }
  return new Map(pairs);
}, [courseSubjectsFromServer]);

const valueToLabel = useMemo(() => {
  const pairs: Array<[string, string]> = [];
  for (const s of courseSubjectsFromServer) {
    const l = String(s?.label ?? "");
    const v = String(s?.value ?? "");
    if (l && v) pairs.push([v, l]);
  }
  return new Map(pairs);
}, [courseSubjectsFromServer]);


  const extractPrefillCourses = () => {
    const raw =
      professionalPrefill?.page4?.courses ??
      professionalPrefill?.courses ??
      professionalPrefill?.page4?.selectedCourses;

    if (!Array.isArray(raw)) return [];

    return raw
      .map((c: any) => {
        const year =
          typeof c?.year === "number" ? c.year : parseInt(String(c?.year), 10);

        if (!year || Number.isNaN(year)) return null;

        const direct =
          Array.isArray(c?.subjects) && typeof c.subjects?.[0] === "string"
            ? (c.subjects as string[]).map((v) => String(v))
            : [];

        const picked = Array.isArray(c?.categories)
          ? (c.categories as any[])
              .flatMap((cat) => (Array.isArray(cat?.subjects) ? cat.subjects : []))
              .filter((s: any) => s?.selected)
              .map((s: any) => String(s?.value ?? s?.code ?? s?.label))
          : [];

        const merged = [...direct, ...picked].filter((v) => typeof v === "string" && v.length > 0);

        return {
          year,
          subjects: Array.from(new Set(merged)),
          customSubjects: [],
        };
      })
      .filter(Boolean) as Array<{ year: number; subjects: string[]; customSubjects: any[] }>;
  };

  useEffect(() => {
    if (didPrefill.current) return;
    if (isLoading) return;
    if (!professionalPrefill) return;

    const prefillCourses = extractPrefillCourses();
    if (!prefillCourses.length) return;

    setStudentInfo((prev: any) => {
      const next = Array.isArray(prev.courses) ? [...prev.courses] : [];

      for (const pc of prefillCourses) {
        const idx = next.findIndex((x: any) => x.year === pc.year);
        if (idx === -1) {
          next.push({ year: pc.year, subjects: pc.subjects, customSubjects: [] });
        } else {
          const merged = Array.from(
            new Set([...(next[idx].subjects ?? []), ...(pc.subjects ?? [])]),
          );
          next[idx] = { ...next[idx], subjects: merged };
        }
      }

      return { ...prev, courses: next };
    });

    didPrefill.current = true;
  }, [professionalPrefill, isLoading, setStudentInfo]);

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

          const selectedSubjectLabels = (courseData.subjects ?? [])
  .map((v: string) => valueToLabel.get(v) ?? null)
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
  const subjectValue = labelToValue.get(subjectLabel);
  if (subjectValue) handleSubjectToggle(year, subjectValue);
}}
                />

                <div className="flex flex-col gap-2">
                  <p className="text-xl font-semibold">교양과목을 추가하세요.</p>
                  <div className="flex items-center gap-2">
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

                <div className="flex flex-col gap-2">
                  <p className="text-xl font-semibold">
                    전공필수/전공선택 과목을 추가하세요.
                  </p>
                  <div className="flex items-center gap-2">
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
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </>
  );
};
