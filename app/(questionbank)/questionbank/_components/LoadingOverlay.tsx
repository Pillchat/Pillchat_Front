"use client";

import { FC } from "react";
import { LoadingIndicator } from "@/components/atoms/LoadingIndicator";

interface LoadingOverlayProps {
  message?: string;
}

const LoadingOverlay: FC<LoadingOverlayProps> = ({
  message = "문제지 생성 중입니다...",
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="mx-6 flex w-full max-w-xs flex-col items-center rounded-2xl bg-white px-8 py-10 shadow-xl">
        <LoadingIndicator
          label={message}
          className="gap-4 py-0 text-center text-base font-medium text-foreground"
        />
      </div>
    </div>
  );
};

export default LoadingOverlay;
