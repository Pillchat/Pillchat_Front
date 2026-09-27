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
        "flex min-h-[58px] w-full min-w-0 items-center justify-center rounded-[12px] border border-border bg-card px-2 py-3 min-[360px]:px-3",
        className,
      )}
      {...props}
    >
      <div className="flex min-w-0 items-center justify-center gap-1 min-[360px]:gap-2 sm:gap-3">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center min-[360px]:h-8 min-[360px]:w-8">
          <img
            src={imageSrc}
            alt={imageAlt}
            className="max-h-[20px] max-w-[20px] object-contain"
          />
        </div>
        <div className="flex min-w-0 items-center">
          <span className="truncate text-[13px] font-medium text-gray-800 min-[360px]:text-[14px]">
            {text}
          </span>
        </div>
      </div>
    </button>
  );
};
