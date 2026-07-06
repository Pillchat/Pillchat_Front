"use client";

import { FC } from "react";
import { PillLoader } from "@/components/atoms";

interface LoadingOverlayProps {
  message?: string;
}

const LoadingOverlay: FC<LoadingOverlayProps> = ({
  message = "문제지 생성 중입니다...",
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="mx-6 flex w-full max-w-xs flex-col items-center rounded-2xl bg-white px-8 py-10 shadow-xl">
        <PillLoader className="mb-4" size={64} decorative />
        <p className="text-center text-base font-medium text-foreground">
          {message}
        </p>
      </div>
    </div>
  );
};

export default LoadingOverlay;
