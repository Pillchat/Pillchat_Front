"use client";

import { ButtonHTMLAttributes, FC } from "react";

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
      className={`flex h-[58px] w-[168.5px] items-center justify-center rounded-[12px] border border-[#C4C4C4] bg-white ${className}`}
      {...props}
    >
      <div className="flex h-[32px] w-[108px] items-center justify-around">
        <div className="flex h-[32px] w-[32px] items-center justify-center">
          <img
            src={imageSrc}
            alt={imageAlt}
            className="max-h-[20px] max-w-[20px] object-contain"
          />
        </div>
        <div className="flex items-center">
          <span className="font-Pretendard text-[14px] font-medium text-[#666666]">
            {text}
          </span>
        </div>
      </div>
    </button>
  );
};