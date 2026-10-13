import { PUBLIC_ASSETS } from "@/constants/assets";
import React from "react";

interface StepHeaderProps {
  onIconClick?: () => void;
  content: string;
  dark?: boolean;
}

function Name({ content, dark }: { content: string; dark?: boolean }) {
  return (
    <p
      className={`min-w-0 text-center text-[16px] font-bold ${dark ? "text-white" : "text-black"}`}
    >
      {content}
    </p>
  );
}

export function StepHeader({ content, onIconClick, dark }: StepHeaderProps) {
  return (
    <div
      className={`relative flex min-h-[calc(60px+env(safe-area-inset-top))] w-full shrink-0 flex-row items-center justify-center px-14 pb-2 pt-[calc(0.5rem+env(safe-area-inset-top))] ${dark ? "bg-black" : "bg-white"}`}
    >
      <img
        src={
          dark
            ? PUBLIC_ASSETS.icons.chevronLeftWhite
            : PUBLIC_ASSETS.icons.chevronLeft
        }
        className="absolute left-5 h-6 w-6 cursor-pointer"
        onClick={onIconClick}
        alt="뒤로가기"
      />
      <Name content={content} dark={dark} />
    </div>
  );
}
