"use client";

import { TextInput } from "@/components/atoms";
import { SectionWithChips } from "@/components/molecules";
import { professionalInfoAtom } from "@/lib/atoms/onboarding";
import { useAtom } from "jotai";
import { FC } from "react";

type SelectAnswerFrequencyProps = {
  username: string;
};

export const SelectAnswerFrequency: FC<SelectAnswerFrequencyProps> = ({
  username = "회원",
}) => {
  const [professionalInfo, setProfessionalInfo] = useAtom(professionalInfoAtom);

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
          data={{
            "답변 형식": ["자율적", "고정적"],
          }}
          selectedItems={
            professionalInfo.answerCycle ? [professionalInfo.answerCycle] : []
          }
          onItemToggle={(item) => {
            setProfessionalInfo({ ...professionalInfo, answerCycle: item });
          }}
          buttonSize="long"
          selectionMode="single"
          comment="고정적으로 답변 시 인센티브가 주어집니다."
        />
        <TextInput
          label="평균 답변 횟수"
          placeholder="횟수를 입력해주세요"
          value={professionalInfo.avgAnswerCount.toString()}
          onChange={(e) => {
            setProfessionalInfo({
              ...professionalInfo,
              avgAnswerCount: parseInt(e.target.value) || 0,
            });
          }}
        />
      </div>
    </div>
  );
};
