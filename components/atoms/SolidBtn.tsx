import React from "react";

interface SolidBtnProps {
  content: string;
  bgColor: string;
  disabled?: boolean;
}

export function SolidBtn({ content, bgColor, disabled }: SolidBtnProps) {
  return (
    <button
      style={{ backgroundColor: bgColor }}
      className="h-[52px] w-[345px] rounded-[12px] px-4 py-2 font-[pretendard] text-[18px] font-medium text-white"
      disabled={disabled}
    >
      {content}
    </button>
  );
}
