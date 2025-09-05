"use client";

import { FC } from "react";
import { useAtom } from "jotai";
import { gradeAtom } from "@/store/profile";

// 등급 매핑
const gradeLabels: Record<number, string> = {
  0: "새싹",
  1: "한알",
  2: "두알",
  3: "고수",
  4: "명약",
};

const gradeColors: Record<number, string> = {
  0: "#4CAF50", // green
  1: "#00BCD4", // teal
  2: "#FFCC00", // yellow
  3: "#FF412E", // red
  4: "#C71200", // dark red
};

export const TextBadge: FC = () => {
  const [grade] = useAtom(gradeAtom);

  // 등급이 없으면 표시하지 않음
  if (grade === null) return null;

  return (
    <div
      className="flex h-[1.375rem] w-auto items-center justify-end rounded-full px-3 text-sm text-white"
      style={{ backgroundColor: gradeColors[grade] }}
    >
      {gradeLabels[grade]}
    </div>
  );
};
