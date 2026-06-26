"use client";

import { cn } from "@/lib/utils";

type Props = {
  onUploadPost?: () => void;
  className?: string;
};

export const CircleButton = ({ onUploadPost, className = "" }: Props) => {
  return (
    <button
      type="button"
      aria-label="게시글 업로드"
      onClick={onUploadPost}
      className={cn(
        "fixed bottom-[132px] right-6 z-[40]",
        "grid h-[64px] w-[64px] place-items-center rounded-full",
        "bg-primary text-primary-foreground shadow-lg",
        "transition-transform duration-200 active:scale-95",
        className,
      )}
    >
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        className="block"
        fill="none"
      >
        <path
          d="M12 1v22"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M1 12h22"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    </button>
  );
};
