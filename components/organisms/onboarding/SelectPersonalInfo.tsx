"use client";

import { TextInput } from "@/components/atoms";
import { SectionWithChips } from "@/components/molecules";
import {
  DAYLIST,
  PROFESSIONAL_ROLE,
  REGISTRATION_STATUS,
  TIMELIST,
} from "@/constants";
import { studentInfoAtom, professionalInfoAtom } from "@/lib/atoms/onboarding";
import { filter, includes } from "lodash";
import { useAtom } from "jotai";

export const SelectPersonalInfo = ({
  role,
  username,
}: {
  role: string;
  username: string;
}) => {
  const [studentInfo, setStudentInfo] = useAtom(studentInfoAtom);
  const [professionalInfo, setProfessionalInfo] = useAtom(professionalInfoAtom);

  const isStudent = role === "student";

  // 공통 유틸리티 함수들
  const getTimeOnly = (time: string) => time.split(" ")[0];

  const getCurrentTimes = () =>
    isStudent ? studentInfo.studyTimes : professionalInfo.availableTimes;

  const getCurrentDays = () =>
    isStudent ? studentInfo.studyDays : professionalInfo.availableDays;

  // 공통 atom 업데이트 함수
  const updateAtom = (
    updates: Partial<typeof studentInfo> | Partial<typeof professionalInfo>,
  ) => {
    if (isStudent) {
      setStudentInfo({ ...studentInfo, ...updates });
    } else {
      setProfessionalInfo({ ...professionalInfo, ...updates });
    }
  };

  // 공통 배열 토글 로직
  const createArrayToggleHandler =
    <T,>(
      getCurrentArray: () => T[],
      maxLength: number,
      updateKey: string,
      transformValue?: (value: string) => T,
    ) =>
    (value: string) => {
      const transformedValue = transformValue
        ? transformValue(value)
        : (value as T);
      const currentArray = getCurrentArray();
      let newArray: T[];

      if (includes(currentArray, transformedValue)) {
        newArray = filter(currentArray, (item) => item !== transformedValue);
      } else if (currentArray.length < maxLength) {
        newArray = [...currentArray, transformedValue];
      } else {
        return;
      }

      updateAtom({ [updateKey]: newArray } as any);
    };

  // 핸들러들
  const handleRegistrationStatusToggle = (status: string) => {
    updateAtom(isStudent ? { grade: status } : { job: status });
  };

  const handleAgeOrWorkplaceChange = (value: string) => {
    updateAtom(
      isStudent ? { age: parseInt(value) || 0 } : { workplace: value },
    );
  };

  const handleStudyDayToggle = createArrayToggleHandler(
    getCurrentDays,
    7,
    isStudent ? "studyDays" : "availableDays",
  );

  const handleStudyTimeToggle = createArrayToggleHandler(
    getCurrentTimes,
    4,
    isStudent ? "studyTimes" : "availableTimes",
    getTimeOnly,
  );

  return (
    <>
      <p className="my-5 text-xl font-semibold">
        {username}님의
        <br />
        맞춤형 서비스를 위한 정보를 입력해주세요.
      </p>
      <div className="flex flex-col gap-8">
        <SectionWithChips
          data={
            role === "student"
              ? {
                  "재적 상태": REGISTRATION_STATUS,
                }
              : {
                  직업: PROFESSIONAL_ROLE,
                }
          }
          selectedItems={
            isStudent ? [studentInfo.grade] : [professionalInfo.job]
          }
          onItemToggle={handleRegistrationStatusToggle}
          selectionMode="single"
        />
        {isStudent ? (
          <TextInput
            label="나이"
            placeholder="나이를 입력해주세요."
            value={studentInfo.age.toString()}
            onChange={(e) => handleAgeOrWorkplaceChange(e.target.value)}
          />
        ) : (
          <TextInput
            label="근무지명"
            placeholder="근무지명을 입력해주세요."
            value={professionalInfo.workplace || ""}
            onChange={(e) => handleAgeOrWorkplaceChange(e.target.value)}
          />
        )}
        <SectionWithChips
          data={
            isStudent
              ? { "주로 공부하는 요일": DAYLIST }
              : { "주로 사용하는 요일": DAYLIST }
          }
          selectedItems={
            isStudent ? studentInfo.studyDays : professionalInfo.availableDays
          }
          onItemToggle={handleStudyDayToggle}
          maxSelection={7}
          buttonSize="square"
        />
        <SectionWithChips
          data={
            isStudent
              ? { "주로 공부하는 시간": TIMELIST }
              : { "주로 답변할 시간": TIMELIST }
          }
          selectedItems={filter(TIMELIST, (time) =>
            includes(getCurrentTimes(), getTimeOnly(time)),
          )}
          onItemToggle={handleStudyTimeToggle}
          maxSelection={4}
          buttonSize="long"
        />
      </div>
    </>
  );
};
