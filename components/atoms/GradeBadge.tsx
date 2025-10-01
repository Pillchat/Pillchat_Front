"use client";

import { FC } from "react";
import { useAtom } from "jotai";
import { gradeAtom } from "@/store/profile";

// 등급 매핑
const gradeLabels: Record<string, string> = {
  "SAESSAK": "새싹",
  "HANAL": "한알", 
  "DUEAL": "두알",
  "GOSU": "고수",
  "MYEONGYAK": "명약",
};

const gradeColors: Record<string, string> = {
  "SAESSAK": "#4CAF50",
  "HANAL": "#FF49B9",
  "DUEAL": "#FFCC00",
  "GOSU": "#FF412E",
  "MYEONGYAK": "#800C00",
};

export const GradeBadge: FC = () => {
  const [grade] = useAtom(gradeAtom);
  
  // 등급이 없거나 빈 문자열이면 표시하지 않음
  if (!grade || grade === "") return null;
  
  // 유효한 등급이 아니면 기본 스타일로 표시
  const backgroundColor = gradeColors[grade] || "#6B7280";
  const displayText = gradeLabels[grade] || grade;

  return (
    <div
      className="flex h-[1.375rem] w-auto items-center justify-end rounded-full px-3 text-sm text-white"
      style={{ backgroundColor }}
    >
      {displayText}
    </div>
  );
}