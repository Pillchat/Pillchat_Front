import { useState, useEffect, useMemo } from "react";
import { useAtom } from "jotai";
import { studentInfoAtom } from "@/lib/atoms/onboarding";
import { REGISTRATION_STATUS } from "@/constants";

export const useCustomSubjects = () => {
  const [studentInfo, setStudentInfo] = useAtom(studentInfoAtom);

  // 각 학년별 입력 필드 상태 관리
  const [showInputs, setShowInputs] = useState<{
    [key: string]: boolean;
  }>({});
  const [inputValues, setInputValues] = useState<{
    [key: string]: string;
  }>({});

  // 각 학년별 커스텀 과목들 관리 - 전공필수와 교양 분리
  const [customGeneralSubjects, setCustomGeneralSubjects] = useState<{
    [key: string]: string[];
  }>({});
  const [customMajorSubjects, setCustomMajorSubjects] = useState<{
    [key: string]: string[];
  }>({});

  // 학년 문자열을 숫자로 변환하는 헬퍼 함수
  const convertYearToNumber = (yearString: string): number => {
    return parseInt(yearString.replace("학년", ""), 10);
  };

  // customSubjects 변경 시 atoms 업데이트
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setStudentInfo((prevStudentInfo) => {
        const updatedCourses = [...prevStudentInfo.courses];

        // 각 학년별로 customSubjects 업데이트
        REGISTRATION_STATUS.forEach((year) => {
          const generalSubjects = customGeneralSubjects[year] || [];
          const majorSubjects = customMajorSubjects[year] || [];
          const allCustomSubjects = [...generalSubjects, ...majorSubjects];
          const yearNumber = convertYearToNumber(year);

          const existingCourseIndex = updatedCourses.findIndex(
            (course) => course.year === yearNumber,
          );

          if (existingCourseIndex >= 0) {
            updatedCourses[existingCourseIndex] = {
              ...updatedCourses[existingCourseIndex],
              customSubjects: allCustomSubjects,
            };
          } else if (allCustomSubjects.length > 0) {
            // 커스텀 과목이 있을 때만 새 course 생성
            updatedCourses.push({
              year: yearNumber,
              subjects: [],
              customSubjects: allCustomSubjects,
            });
          }
        });

        return { ...prevStudentInfo, courses: updatedCourses };
      });
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [
    customGeneralSubjects,
    customMajorSubjects,
    REGISTRATION_STATUS,
    setStudentInfo,
  ]);

  // 커스텀 과목 추가
  const addCustomSubject = (
    year: string,
    customSubject: string,
    type: "general" | "major",
  ) => {
    if (type === "general") {
      setCustomGeneralSubjects((prev) => ({
        ...prev,
        [year]: [...(prev[year] || []), customSubject],
      }));
    } else {
      setCustomMajorSubjects((prev) => ({
        ...prev,
        [year]: [...(prev[year] || []), customSubject],
      }));
    }
  };

  // 커스텀 과목 삭제
  const removeCustomSubject = (
    year: string,
    customSubject: string,
    type: "general" | "major",
  ) => {
    if (type === "general") {
      setCustomGeneralSubjects((prev) => ({
        ...prev,
        [year]: (prev[year] || []).filter(
          (subject) => subject !== customSubject,
        ),
      }));
    } else {
      setCustomMajorSubjects((prev) => ({
        ...prev,
        [year]: (prev[year] || []).filter(
          (subject) => subject !== customSubject,
        ),
      }));
    }
  };

  // 입력 필드 표시/숨김
  const toggleInput = (
    year: string,
    type: "general" | "major",
    show: boolean,
  ) => {
    const inputKey = `${year}-${type}`;
    setShowInputs((prev) => ({ ...prev, [inputKey]: show }));
    if (!show) {
      setInputValues((prev) => ({ ...prev, [inputKey]: "" }));
    }
  };

  // 입력값 변경
  const updateInputValue = (
    year: string,
    type: "general" | "major",
    value: string,
  ) => {
    const inputKey = `${year}-${type}`;
    setInputValues((prev) => ({ ...prev, [inputKey]: value }));
  };

  // 입력 제출 (엔터 키)
  const handleInputSubmit = (
    e: React.KeyboardEvent<HTMLInputElement>,
    year: string,
    type: "general" | "major",
  ) => {
    const inputKey = `${year}-${type}`;
    const inputValue = inputValues[inputKey];

    if (e.key === "Enter" && inputValue?.trim()) {
      const newSubject = inputValue.trim();

      // 중복 체크
      const existingSubjects =
        type === "general"
          ? customGeneralSubjects[year] || []
          : customMajorSubjects[year] || [];

      if (!existingSubjects.includes(newSubject)) {
        addCustomSubject(year, newSubject, type);
      }

      // 입력 필드 초기화
      toggleInput(year, type, false);
    }
  };

  // 입력 필드 블러 처리
  const handleInputBlur = (year: string, type: "general" | "major") => {
    toggleInput(year, type, false);
  };

  // 특정 학년의 과목 데이터 가져오기
  const getCustomSubjectsForYear = (year: string) => ({
    general: customGeneralSubjects[year] || [],
    major: customMajorSubjects[year] || [],
  });

  // 입력 필드 상태 가져오기
  const getInputState = (year: string, type: "general" | "major") => {
    const inputKey = `${year}-${type}`;
    return {
      isVisible: showInputs[inputKey] || false,
      value: inputValues[inputKey] || "",
    };
  };

  return {
    customGeneralSubjects,
    customMajorSubjects,
    addCustomSubject,
    removeCustomSubject,
    toggleInput,
    updateInputValue,
    handleInputSubmit,
    handleInputBlur,
    getCustomSubjectsForYear,
    getInputState,
  };
};
