'use client'

import { useEffect } from "react";

interface ToastProps {
  open: boolean;
  message: string;
  onClose: () => void;
  duration?: number;
}

export function Toast({ open, message, onClose, duration = 3000 }: ToastProps) {
  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => onClose(), duration);
    return () => clearTimeout(timer);
  }, [open, duration, onClose]);

  if (!open) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[1000] flex items-center justify-center">
      <div className="pointer-events-auto relative z-[1001] mb-12 w-[90%] rounded-xl bg-[#11111170] px-5 py-3 text-center text-sm font-medium text-white shadow-xl dark:bg-neutral-900">
        {message}
      </div>
    </div>
  );
}
