import React from "react";

interface StrokeBtnProps {
  content: string;
  Color: string;
}

export function StrokeButton({ content, Color }: StrokeBtnProps) {
  return (
    <button
      style={{
        color: Color,
        border: `1px solid ${Color}`,
      }}
      className="h-[52px] w-full rounded-[12px] bg-white font-[pretendard] text-[18px] font-medium"
    >
      {content}
    </button>
  );
}