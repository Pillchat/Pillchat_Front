"use client";

import { SectionWithChips } from "@/components/molecules";
import {
  currentStepAtom,
  professionalInfoAtom,
  studentInfoAtom,
} from "@/lib/atoms/onboarding";
import { useAtom } from "jotai";
import { useEffect, useMemo, useRef } from "react";

type PrefillSubject = {
  label: string;
  value: string;
  selected: boolean;
};

type PrefillFormData = {
  page1?: {
    categories?: Array<{
      categoryName: string;
      subjects: PrefillSubject[];
    }>;
  };
};

type Props = {
  role: string;
  username: string;
  prefillStrongSubjects?: string[];
  prefillFormData?: PrefillFormData | null;
};

export const SelectSubject = ({
  role,
  username,
  prefillStrongSubjects = [],
  prefillFormData = null,
}: Props) => {
  const [currentStep] = useAtom(currentStepAtom);

  const isProfessional = role === "professional";
  const isStudent = role === "student";

  const [professionalInfo, setProfessionalInfo] = useAtom(professionalInfoAtom);
  const [studentInfo, setStudentInfo] = useAtom(studentInfoAtom);

  const categories = useMemo(() => {
    return prefillFormData?.page1?.categories ?? [];
  }, [prefillFormData]);

  const subjectsFromForm = useMemo(() => {
    return categories.flatMap((c) => c.subjects ?? []);
  }, [categories]);

  const labelToValue = useMemo(() => {
    return new Map(subjectsFromForm.map((s) => [s.label, s.value]));
  }, [subjectsFromForm]);

  const valueToLabel = useMemo(() => {
    return new Map(subjectsFromForm.map((s) => [s.value, s.label]));
  }, [subjectsFromForm]);

  const subjectMapForChipsFromForm = useMemo(() => {
    const obj: Record<string, string[]> = {};
    for (const c of categories) {
      obj[c.categoryName] = (c.subjects ?? []).map((s) => s.label);
    }
    return obj;
  }, [categories]);

  const chipSetFromForm = useMemo(() => {
    return new Set(Object.values(subjectMapForChipsFromForm).flat());
  }, [subjectMapForChipsFromForm]);

  const selectedFromServerValues = useMemo(() => {
    return subjectsFromForm.filter((s) => s.selected).map((s) => s.value);
  }, [subjectsFromForm]);

  const studentKey = useMemo(() => {
    return currentStep === 2 ? "weakSubjects" : "strongSubjects";
  }, [currentStep]);

  const selectedValuesProfessional = useMemo(() => {
    const raw = (professionalInfo as any)?.strongSubjects;
    return Array.isArray(raw) ? raw : [];
  }, [professionalInfo]);

  const selectedValuesStudent = useMemo(() => {
    const raw = (studentInfo as any)?.[studentKey];
    return Array.isArray(raw) ? raw : [];
  }, [studentInfo, studentKey]);

  const selectedLabelsProfessional = useMemo(() => {
    return selectedValuesProfessional
      .map((v: string) => valueToLabel.get(v) ?? v)
      .filter((label: string) => chipSetFromForm.has(label));
  }, [selectedValuesProfessional, valueToLabel, chipSetFromForm]);

  const selectedLabelsStudent = useMemo(() => {
    return selectedValuesStudent
      .map((v: string) => valueToLabel.get(v) ?? v)
      .filter((label: string) => chipSetFromForm.has(label));
  }, [selectedValuesStudent, valueToLabel, chipSetFromForm]);

  const didPrefill = useRef(false);

  useEffect(() => {
    didPrefill.current = false;
  }, [role, currentStep]);

  useEffect(() => {
    if (!prefillFormData) return;
    if (didPrefill.current) return;

    if (isProfessional) {
      const merged = Array.from(
        new Set([...prefillStrongSubjects, ...selectedFromServerValues]),
      )
        .filter((v) => typeof v === "string" && v.length > 0)
        .slice(0, 5);

      if (merged.length) {
        setProfessionalInfo((prev: any) => ({
          ...prev,
          strongSubjects: merged,
        }));
      }

      didPrefill.current = true;
      return;
    }

    if (isStudent) {
      const merged = Array.from(new Set([...selectedFromServerValues])).slice(
        0,
        5,
      );

      if (merged.length) {
        setStudentInfo((prev: any) => ({
          ...prev,
          [studentKey]: merged,
        }));
      }

      didPrefill.current = true;
      return;
    }
  }, [
    prefillFormData,
    isProfessional,
    isStudent,
    prefillStrongSubjects,
    selectedFromServerValues,
    setProfessionalInfo,
    setStudentInfo,
    studentKey,
  ]);

  const toggleByLabel = (label: string) => {
    const value = labelToValue.get(label);
    if (!value) return;

    if (isProfessional) {
      const cur = selectedValuesProfessional;
      const exists = cur.includes(value);

      if (exists) {
        const next = cur.filter((x: string) => x !== value);
        setProfessionalInfo((prev: any) => ({ ...prev, strongSubjects: next }));
        return;
      }

      if (cur.length >= 5) return;
      setProfessionalInfo((prev: any) => ({
        ...prev,
        strongSubjects: [...cur, value],
      }));
      return;
    }

    if (isStudent) {
      const cur = selectedValuesStudent;
      const exists = cur.includes(value);

      if (exists) {
        const next = cur.filter((x: string) => x !== value);
        setStudentInfo((prev: any) => ({ ...prev, [studentKey]: next }));
        return;
      }

      if (cur.length >= 5) return;
      setStudentInfo((prev: any) => ({
        ...prev,
        [studentKey]: [...cur, value],
      }));
      return;
    }
  };

  if (!prefillFormData) return <div>과목 정보를 불러오는 중...</div>;

  return (
    <>
      <p className="my-5 text-xl font-semibold">
        {username}님이
        <br />
        <span className="text-primary">
          {isProfessional
            ? "자신있어 하는 과목"
            : currentStep === 3
              ? "어려워 하는 과목"
              : "자신있어 하는 과목"}
        </span>
        을 골라주세요. (최대 5개)
      </p>

      <SectionWithChips
        data={subjectMapForChipsFromForm}
        selectedItems={
          isProfessional ? selectedLabelsProfessional : selectedLabelsStudent
        }
        onItemToggle={toggleByLabel}
        maxSelection={5}
      />
    </>
  );
};
