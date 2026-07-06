"use client";

import { useEffect, useRef, useState } from "react";

interface ToastProps {
  open: boolean;
  message: string;
  onClose: () => void;
  duration?: number;
  toastKey?: string | number;
}

const TOAST_FADE_OUT_MS = 1000;

export function Toast({
  open,
  message,
  onClose,
  duration = 3000,
  toastKey,
}: ToastProps) {
  const [isFadingOut, setIsFadingOut] = useState(false);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) {
      setIsFadingOut(false);
      return;
    }

    setIsFadingOut(false);

    const fadeOutDelay = Math.max(duration - TOAST_FADE_OUT_MS, 0);
    const fadeOutTimer = setTimeout(() => {
      setIsFadingOut(true);
    }, fadeOutDelay);
    const closeTimer = setTimeout(() => onCloseRef.current(), duration);

    return () => {
      clearTimeout(fadeOutTimer);
      clearTimeout(closeTimer);
    };
  }, [open, duration, message, toastKey]);

  if (!open) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[1000] flex items-center justify-center">
      <div
        className={`pointer-events-auto relative z-[1001] mb-12 w-[90%] rounded-xl bg-foreground/70 px-5 py-3 text-center text-sm font-medium text-primary-foreground shadow-xl transition-opacity duration-1000 ease-out dark:bg-neutral-900 ${
          isFadingOut ? "opacity-0" : "opacity-100"
        }`}
      >
        {message}
      </div>
    </div>
  );
}
