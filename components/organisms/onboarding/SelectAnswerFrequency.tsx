"use client";

import { TextInput } from "@/components/atoms";
import { SectionWithChips } from "@/components/molecules";
import { professionalInfoAtom } from "@/lib/atoms/onboarding";
import { useAtom } from "jotai";
import { FC, useEffect, useMemo, useRef } from "react";

type Opt = {
  label: string;
  value: string;
  selected: boolean;
};

type ProfessionalFormData = {
  page3?: {
    answerCycles?: Opt[];
    avgAnswerCount?: number;
  };
};

type SelectAnswerFrequencyProps = {
  username: string;
  professionalPrefill?: ProfessionalFormData | null;
};

export const SelectAnswerFrequency: FC<SelectAnswerFrequencyProps> = ({
  username = "회원",
  professionalPrefill = null,
}) => {
  const [professionalInfo, setProfessionalInfo] = useAtom(professionalInfoAtom);
  const didPrefill = useRef(false);

  const answerCycles = useMemo(() => {
    return professionalPrefill?.page3?.answerCycles ?? [];
  }, [professionalPrefill]);

  const labelToValue = useMemo(() => {
    return new Map(answerCycles.map((c) => [c.label, c.value]));
  }, [answerCycles]);

  const valueToLabel = useMemo(() => {
    return new Map(answerCycles.map((c) => [c.value, c.label]));
  }, [answerCycles]);

  const chipLabels = useMemo(() => {
    return answerCycles.map((c) => c.label);
  }, [answerCycles]);

  useEffect(() => {
    if (didPrefill.current) return;
    if (!professionalPrefill?.page3) return;

    const pickedValue =
      answerCycles.find((c) => c.selected)?.value ??
      (answerCycles.find((c) => c.selected)?.label
        ? labelToValue.get(answerCycles.find((c) => c.selected)!.label)
        : undefined);

    const avg = professionalPrefill.page3.avgAnswerCount;

    setProfessionalInfo((prev: any) => ({
      ...prev,
      ...(pickedValue ? { answerCycle: pickedValue } : {}),
      ...(typeof avg === "number" ? { avgAnswerCount: avg } : {}),
    }));

    didPrefill.current = true;
  }, [professionalPrefill, answerCycles, labelToValue, setProfessionalInfo]);

  const selectedLabel = useMemo(() => {
    const v = (professionalInfo as any).answerCycle;
    if (!v) return [];
    return [valueToLabel.get(v) ?? v];
  }, [professionalInfo, valueToLabel]);

  const onToggle = (label: string) => {
    const value = labelToValue.get(label) ?? label;
    setProfessionalInfo((prev: any) => ({ ...prev, answerCycle: value }));
  };

  return (
    <div>
      <p className="my-5 text-xl font-semibold">
        {username}님은
        <br />
        답변을 얼마나 주기적으로 하실건가요?
      </p>

      <div className="flex flex-col gap-8">
        <SectionWithChips
          className="flex flex-col gap-1"
          data={{ "답변 주기": chipLabels }}
          selectedItems={selectedLabel}
          onItemToggle={onToggle}
          buttonSize="long"
          selectionMode="single"
          comment="고정적으로 답변 시 인센티브가 주어집니다."
        />

        <TextInput
          label="평균 답변 횟수"
          placeholder="횟수를 입력해주세요"
          value={String((professionalInfo as any).avgAnswerCount ?? 0)}
          onChange={(e) => {
            const n = parseInt(e.target.value, 10);
            setProfessionalInfo((prev: any) => ({
              ...prev,
              avgAnswerCount: Number.isFinite(n) ? n : 0,
            }));
          }}
        />
      </div>
    </div>
  );
};
