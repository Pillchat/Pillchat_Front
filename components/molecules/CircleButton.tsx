"use client";

import { useState } from "react";

type Props = {
  onUploadStudy?: () => void;
  onUploadPost?: () => void;
  className?: string;
};

export const CircleButton = ({
  onUploadStudy,
  onUploadPost,
  className = "",
}: Props) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-[60] bg-black/60"
          onClick={() => setOpen(false)}
        />
      )}

      {open && (
        <div className="fixed bottom-[215px] right-6 z-[70] h-[120px] w-[164px]">
          <div className="relative h-full w-full">
            <button
              type="button"
              onClick={onUploadPost}
              className="absolute right-0 top-0 h-[56px] w-[148px] rounded-[12px] bg-primary"
            >
              <div className="flex items-center px-5 py-3 font-['Pretendard'] text-[14px] font-medium text-white">
                <img src="/circle+.svg" alt="게시물 올리기" />
                <span>게시물 올리기</span>
              </div>
            </button>

            <button
              type="button"
              onClick={onUploadStudy}
              className="absolute bottom-0 right-0 h-[56px] w-[160px] rounded-[12px] bg-primary"
            >
              <div className="flex items-center px-5 py-3 font-['Pretendard'] text-[14px] font-medium text-white">
                <img src="/data.svg" alt="학습자료 올리기" />
                <span>학습자료 올리기</span>
              </div>
            </button>
          </div>
        </div>
      )}

      <button
        type="button"
        aria-label="circle action"
        onClick={() => setOpen((v) => !v)}
        className={[
          "fixed bottom-[132px] right-6 z-[70]",
          "h-[64px] w-[64px] rounded-full",
          "grid place-items-center",
          open
            ? "rotate-45 bg-white text-primary"
            : "rotate-0 bg-primary text-white",
          "transition-transform duration-200",
          className,
        ].join(" ")}
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
    </>
  );
};
