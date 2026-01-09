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
import { useEffect, useRef } from "react";

type Opt = { label?: string; value?: string; selected?: boolean };

const norm = (s?: string) => (s ?? "").replace(/\s+/g, "");

const jobFromServerToLabel = (serverJob?: string) => {
  if (!serverJob) return "";
  const found = (PROFESSIONAL_ROLE as readonly string[]).find(
    (x) => norm(x) === norm(serverJob),
  );
  return found ?? serverJob;
};

export const SelectPersonalInfo = ({
  role,
  username,
  professionalPrefill,
}: {
  role: string;
  username: string;
  professionalPrefill?: any;
}) => {
  const [studentInfo, setStudentInfo] = useAtom(studentInfoAtom);
  const [professionalInfo, setProfessionalInfo] = useAtom(professionalInfoAtom);

  const isStudent = role === "student";
  const didPrefill = useRef(false);

  const getTimeOnly = (time: string) => time.split(" ")[0];

  const getCurrentTimes = () =>
    isStudent ? studentInfo.studyTimes : professionalInfo.availableTimes;

  const getCurrentDays = () =>
    isStudent ? studentInfo.studyDays : professionalInfo.availableDays;

  const updateAtom = (
    updates: Partial<typeof studentInfo> | Partial<typeof professionalInfo>,
  ) => {
    if (isStudent) setStudentInfo({ ...studentInfo, ...updates });
    else setProfessionalInfo({ ...professionalInfo, ...updates });
  };

  useEffect(() => {
    didPrefill.current = false;
  }, [role]);

  useEffect(() => {
    if (didPrefill.current) return;
    if (!professionalPrefill) return;

    if (!isStudent) {
      const pickedJob = professionalPrefill?.page4?.jobs?.find(
        (j: Opt) => j.selected,
      );
      const jobRaw = pickedJob?.value ?? pickedJob?.label;
      const jobLabel = jobFromServerToLabel(jobRaw);

      const workplace = professionalPrefill?.page4?.workplace;

      const days =
        (professionalPrefill?.page2?.availableDays ?? [])
          .filter((d: Opt) => d.selected)
          .map((d: Opt) => d.value ?? d.label)
          .filter(Boolean)
          .slice(0, 7) ?? [];

      const times =
        (professionalPrefill?.page2?.availableTimes ?? [])
          .filter((t: Opt) => t.selected)
          .map((t: Opt) => t.value ?? t.label)
          .filter(Boolean)
          .slice(0, 4) ?? [];

      setProfessionalInfo((prev) => ({
        ...prev,
        ...(jobLabel ? { job: jobLabel } : {}),
        ...(workplace !== undefined ? { workplace } : {}),
        ...(days.length ? { availableDays: days } : {}),
        ...(times.length ? { availableTimes: times } : {}),
      }));

      didPrefill.current = true;
      return;
    }

    const pickedGrade = professionalPrefill?.page1?.registrationStatuses?.find(
      (x: Opt) => x.selected,
    );
    const grade =
      professionalPrefill?.page1?.grades?.find((x: Opt) => x.selected)?.value ??
      professionalPrefill?.page1?.grades?.find((x: Opt) => x.selected)?.label;

    const age =
      typeof professionalPrefill?.page1?.age === "number"
        ? professionalPrefill.page1.age
        : undefined;

    const days =
      (professionalPrefill?.page1?.studyDays ?? [])
        .filter((d: Opt) => d.selected)
        .map((d: Opt) => d.value ?? d.label)
        .filter(Boolean)
        .slice(0, 7) ?? [];

    const times =
      (professionalPrefill?.page1?.studyTimes ?? [])
        .filter((t: Opt) => t.selected)
        .map((t: Opt) => t.value ?? t.label)
        .filter(Boolean)
        .slice(0, 4) ?? [];

    setStudentInfo((prev) => ({
      ...prev,
      ...(grade ? { grade } : {}),
      ...(age !== undefined ? { age } : {}),
      ...(days.length ? { studyDays: days } : {}),
      ...(times.length ? { studyTimes: times } : {}),
    }));

    didPrefill.current = true;
  }, [professionalPrefill, isStudent, setProfessionalInfo, setStudentInfo]);

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
              ? { "재적 상태": REGISTRATION_STATUS }
              : { 직업: PROFESSIONAL_ROLE as unknown as string[] }
          }
          selectedItems={
            isStudent
              ? studentInfo.grade
                ? [studentInfo.grade]
                : []
              : professionalInfo.job
                ? [professionalInfo.job]
                : []
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
