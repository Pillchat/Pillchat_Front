"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { ROUTE_PROGRESS_START_EVENT } from "@/lib/routeProgress";
import { PillLoader } from "@/components/atoms/PillLoader";

export const TopRouteProgress = () => {
  const pathname = usePathname();

  const [visible, setVisible] = useState(false);
  const hideTimerRef = useRef<number | null>(null);
  const fallbackTimerRef = useRef<number | null>(null);
  const visibleRef = useRef(false);
  const finishingRef = useRef(false);
  const currentPathRef = useRef(pathname);

  const clearHideTimer = () => {
    if (hideTimerRef.current) {
      window.clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  };

  const clearFallbackTimer = () => {
    if (fallbackTimerRef.current) {
      window.clearTimeout(fallbackTimerRef.current);
      fallbackTimerRef.current = null;
    }
  };

  const start = () => {
    if (visibleRef.current && !finishingRef.current) return;

    clearHideTimer();
    clearFallbackTimer();

    visibleRef.current = true;
    finishingRef.current = false;
    setVisible(true);

    fallbackTimerRef.current = window.setTimeout(() => {
      if (currentPathRef.current === window.location.pathname) {
        done();
      }
    }, 6000);
  };

  const done = () => {
    if (!visibleRef.current) return;

    clearHideTimer();
    clearFallbackTimer();
    finishingRef.current = true;

    hideTimerRef.current = window.setTimeout(() => {
      visibleRef.current = false;
      finishingRef.current = false;
      hideTimerRef.current = null;
      setVisible(false);
    }, 220);
  };

  useEffect(() => {
    const shouldTrackNavigation = (nextUrl: URL, currentUrl: URL) =>
      nextUrl.origin === currentUrl.origin &&
      nextUrl.pathname !== currentUrl.pathname;

    const handleProgressStart = () => {
      start();
    };

    const handleClick = (e: MouseEvent) => {
      if (e.defaultPrevented) return;
      if (e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      const target = e.target as HTMLElement | null;
      const anchor = target?.closest("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      const targetAttr = anchor.getAttribute("target");
      const downloadAttr = anchor.getAttribute("download");

      if (!href || href.startsWith("#")) return;
      if (targetAttr === "_blank" || downloadAttr !== null) return;

      const url = new URL(anchor.href, window.location.href);
      const current = new URL(window.location.href);
      if (!shouldTrackNavigation(url, current)) return;

      start();
    };

    const handlePopState = () => {
      const current = new URL(window.location.href);
      if (current.pathname !== currentPathRef.current) {
        start();
      }
    };

    document.addEventListener("click", handleClick, true);
    window.addEventListener("popstate", handlePopState);
    window.addEventListener(ROUTE_PROGRESS_START_EVENT, handleProgressStart);

    return () => {
      document.removeEventListener("click", handleClick, true);
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener(
        ROUTE_PROGRESS_START_EVENT,
        handleProgressStart,
      );
      clearHideTimer();
      clearFallbackTimer();
    };
  }, []);

  useEffect(() => {
    if (pathname === currentPathRef.current) return;

    currentPathRef.current = pathname;
    done();
  }, [pathname]);

  if (!visible) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-[calc(env(safe-area-inset-top)+4rem)] z-[9999] flex justify-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-md">
        <PillLoader size={40} label="페이지 이동 중" />
      </div>
    </div>
  );
};
