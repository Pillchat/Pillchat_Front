import React from "react";

interface StrokeBtnProps {
  content: string;
  Color: string;
}

export function StrokeBtn({ content, Color }: StrokeBtnProps) {
  return (
    <button
      style={{
        color: Color,
        border: `1px solid ${Color}`,
      }}
      className="w-[345px] h-[52px] font-[pretendard] font-medium text-[18px] rounded-[12px] bg-white"
    >
      {content}
    </button>
  );
}
