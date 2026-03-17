"use client";

import { FC } from "react";

interface LoadingOverlayProps {
  message?: string;
}

const LoadingOverlay: FC<LoadingOverlayProps> = ({
  message = "문제지 생성 중입니다...",
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="mx-6 flex w-full max-w-xs flex-col items-center rounded-2xl bg-white px-8 py-10 shadow-xl">
        {/* 스피너 */}
        <div className="mb-4 h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-brand" />
        <p className="text-center text-base font-medium text-foreground">
          {message}
        </p>
      </div>
    </div>
  );
};

export default LoadingOverlay;
