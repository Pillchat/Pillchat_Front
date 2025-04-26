import React from "react";

interface PrimaryBtnProps {
  content: string;
  bgColor: string;
}

export function PrimaryBtn({ content, bgColor }: PrimaryBtnProps) {
  return (
    <button
      style={{ backgroundColor: bgColor }}
      className="w-[345px] h-[52px] font-[pretendard] font-medium text-[18px] text-white py-2 px-4 rounded-[12px]"
    >
      {content}
    </button>
  );
}
