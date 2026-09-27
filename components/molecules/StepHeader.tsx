import React from "react";

interface StepHeaderProps {
  onIconClick?: () => void;
  content: string;
  dark?: boolean;
}

function Name({ content, dark }: { content: string; dark?: boolean }) {
  return (
    <p
      className={`text-[16px] font-bold ${dark ? "text-white" : "text-black"}`}
    >
      {content}
    </p>
  );
}

export function StepHeader({ content, onIconClick, dark }: StepHeaderProps) {
  return (
    <div
      className={`relative flex h-[calc(60px+env(safe-area-inset-top))] w-full flex-row items-center justify-center pt-[env(safe-area-inset-top)] ${dark ? "bg-black" : "bg-white"}`}
    >
      <img
        src={dark ? "/icons/ReturnPage-white.svg" : "/icons/ReturnPage.svg"}
        className="absolute left-5 h-6 w-6 cursor-pointer"
        onClick={onIconClick}
        alt="뒤로가기"
      />
      <Name content={content} dark={dark} />
    </div>
  );
}
