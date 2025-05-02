import React from "react";

interface PrimaryBtnProps {
  content: string;
  bgColor: string;
}

export function PrimaryBtn({ content, bgColor }: PrimaryBtnProps) {
  return (
    <button
      style={{ backgroundColor: bgColor }}
      className="h-[52px] w-[345px] rounded-[12px] px-4 py-2 font-[pretendard] text-[18px] font-medium text-white"
    >
      {content}
    </button>
  );
}
