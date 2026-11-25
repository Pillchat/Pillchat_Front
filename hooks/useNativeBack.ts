"use client";
import { useEffect, useRef } from "react";
import { registerNativeBack } from "@/lib/client/nativeApp";

export function useNativeBack(
  enabled: boolean,
  onBack: () => void,
  priority = 0,
) {
  const callback = useRef(onBack);
  callback.current = onBack;
  useEffect(() => {
    if (enabled && typeof window !== "undefined")
      return registerNativeBack(() => callback.current(), priority);
  }, [enabled, priority]);
}
