"use client";

import { useAtom } from "jotai";
import {
  buttonLabelAtom,
  currentStepAtom,
  studentInfoAtom,
  professionalInfoAtom,
} from "@/lib/atoms/onboarding";
import { Button } from "@/components/ui/button";
import { SelectModal } from "../SelectModal";
import { FC, useEffect, useMemo, useState } from "react";
import { useRouter } from "@/lib/navigation";
import { useParams } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { fetchAPI } from "@/lib/functions";
import { useLogout } from "@/app/(setting)/mypage/_hooks/useLogout";

type OnboardingFooterProps = {
  role?: string;
  professionalPrefill?: any;
};

const norm = (s?: string) => (s ?? "").replace(/\s+/g, "");
const isStr = (v: any): v is string => typeof v === "string" && v.length > 0;

export const OnboardingFooter: FC<OnboardingFooterProps> = ({
  role,
  professionalPrefill,
}) => {
  const router = useRouter();
  const params = useParams();
  const currentRole = String(role ?? (params as any)?.role ?? "");

  const [label, setLabel] = useAtom(buttonLabelAtom);
  const [currentStep, setCurrentStep] = useAtom(currentStepAtom);
  const [studentInfo] = useAtom(studentInfoAtom);
  const [professionalInfo] = useAtom(professionalInfoAtom);
  const [openModal, setOpenModal] = useState<"logout" | null>(null);
  const { onLogout } = useLogout();

  const { labelToValue, labelToValueNorm } = useMemo(() => {
    const pairs: Array<[string, string]> = [];

    const pushCategories = (cats: any) => {
      if (!Array.isArray(cats)) return;
      for (const c of cats) {
        const subs = c?.subjects;
        if (!Array.isArray(subs)) continue;
        for (const s of subs) {
          const l = s?.label;
          const v = s?.value;
          if (isStr(l) && isStr(v)) pairs.push([l, v]);
        }
      }
    };

    pushCategories(professionalPrefill?.page1?.categories);
    pushCategories(professionalPrefill?.page2?.categories);
    pushCategories(professionalPrefill?.page3?.categories);

    const courses = professionalPrefill?.page4?.courses;
    if (Array.isArray(courses)) {
      for (const course of courses) {
        pushCategories(course?.categories);
      }
    }

    const m1 = new Map<string, string>(pairs);
    const m2 = new Map<string, string>(pairs.map(([l, v]) => [norm(l), v]));

    return { labelToValue: m1, labelToValueNorm: m2 };
  }, [professionalPrefill]);

  const toValues = (arr: any, limit?: number) => {
    const raw = Array.isArray(arr) ? arr : [];
    const converted = raw
      .filter(isStr)
      .map((v) => labelToValue.get(v) ?? labelToValueNorm.get(norm(v)) ?? v);
    const uniq = Array.from(new Set(converted));
    return typeof limit === "number" ? uniq.slice(0, limit) : uniq;
  };

  const { mutate, isPending } = useMutation({
    mutationFn: async (onboardingData: any) => {
      const endpoint = `/api/onboarding/${currentRole}`;
      const response = await fetchAPI(endpoint, "PUT", onboardingData);
      return (response as any)?.data ?? response;
    },
    onSuccess: () => {
      setOpenModal(null);
      onLogout();
    },
    onError: (error) => {
      console.error("온보딩 API 에러:", error);
    },
  });

  const getFinalStep = () => (currentRole === "student" ? 4 : 3);

  const prepareOnboardingData = () => {
    if (currentRole === "professional") {
      const raw =
        (professionalInfo as any).strongSubjects ??
        (professionalInfo as any).selectedSubjectLabels ??
        (professionalInfo as any).subjects ??
        [];

      const strongSubjects = toValues(raw, 5);

      return {
        ...professionalInfo,
        job: norm((professionalInfo as any).job),
        strongSubjects,
      };
    }

    const next: any = { ...studentInfo };

    const strong =
      "strongSubjects" in next ? toValues(next.strongSubjects, 5) : [];
    const weak = "weakSubjects" in next ? toValues(next.weakSubjects, 5) : [];

    if ("strongSubjects" in next) next.strongSubjects = weak;
    if ("weakSubjects" in next) next.weakSubjects = strong;

    if (Array.isArray(next.courses)) {
      next.courses = next.courses.map((c: any) => ({
        ...c,
        subjects: toValues(c?.subjects),
      }));
    }

    return next;
  };

  const handleClick = () => {
    const finalStep = getFinalStep();

    if (currentStep === finalStep) {
      setOpenModal("logout");
      return;
    }

    if (currentStep < finalStep) {
      setCurrentStep((prev) => prev + 1);
      return;
    }
  };

  useEffect(() => {
    const finalStep = getFinalStep();
    setLabel(currentStep === finalStep ? "로그인 화면으로 가기" : "다음");
  }, [currentStep, setLabel, currentRole]);

  return (
    <>
      <footer className="flex flex-col gap-2 p-4">
        {currentStep < getFinalStep() && (
          <p className="text-center text-xs text-muted-foreground">
            선택한 항목은 마이페이지에서 변경 가능합니다.
          </p>
        )}
        <Button
          size="lg"
          className="h-14 w-full"
          disabled={isPending}
          onClick={handleClick}
        >
          {isPending ? "처리 중..." : label}
        </Button>
      </footer>

      <SelectModal
        isOpen={openModal === "logout"}
        onClose={() => setOpenModal(null)}
        onConfirm={() => {
          if (isPending) return;
          mutate(prepareOnboardingData());
        }}
        title="로그인 화면으로 가기"
        message="로그인 화면으로 가기 선택 시 로그아웃됩니다."
      />
    </>
  );
};
