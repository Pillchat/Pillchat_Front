"use client";

import { ButtonHTMLAttributes, FC } from "react";
import { cn } from "@/lib/utils";

interface BoardButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  imageSrc: string;
  imageAlt?: string;
  text: string;
}

export const BoardButton: FC<BoardButtonProps> = ({
  imageSrc,
  imageAlt = "board button image",
  text,
  className = "",
  ...props
}) => {
  return (
    <button
      type="button"
      className={cn(
        "flex min-h-[58px] w-full min-w-0 items-center justify-center rounded-[12px] border border-border bg-card px-3 py-3",
        className,
      )}
      {...props}
    >
      <div className="flex min-w-0 items-center justify-center gap-2 sm:gap-3">
        <div className="flex h-[32px] w-[32px] shrink-0 items-center justify-center">
          <img
            src={imageSrc}
            alt={imageAlt}
            className="max-h-[20px] max-w-[20px] object-contain"
          />
        </div>
        <div className="flex min-w-0 items-center">
          <span className="font-Pretendard truncate text-[14px] font-medium text-gray-800">
            {text}
          </span>
        </div>
      </div>
    </button>
  );
};
