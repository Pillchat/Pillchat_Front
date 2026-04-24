"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { ROUTE_PROGRESS_START_EVENT } from "@/lib/routeProgress";

export const TopRouteProgress = () => {
  const pathname = usePathname();

  const barRef = useRef<HTMLDivElement | null>(null);
  const timerRef = useRef<number | null>(null);
  const hideTimerRef = useRef<number | null>(null);
  const widthRef = useRef(0);
  const visibleRef = useRef(false);
  const finishingRef = useRef(false);
  const currentPathRef = useRef(pathname);

  const syncBar = () => {
    const bar = barRef.current;
    if (!bar) return;

    bar.style.width = `${widthRef.current}%`;
    bar.style.opacity = visibleRef.current ? "1" : "0";
  };

  const clearTimer = () => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const clearHideTimer = () => {
    if (hideTimerRef.current) {
      window.clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  };

  const start = () => {
    clearHideTimer();
    clearTimer();

    if (visibleRef.current && !finishingRef.current) return;

    visibleRef.current = true;
    finishingRef.current = false;
    widthRef.current =
      widthRef.current > 0 && widthRef.current < 88 ? widthRef.current : 18;
    syncBar();

    timerRef.current = window.setInterval(() => {
      if (widthRef.current >= 88) return;
      if (widthRef.current < 40) {
        widthRef.current += 12;
      } else if (widthRef.current < 70) {
        widthRef.current += 6;
      } else {
        widthRef.current += 2;
      }

      syncBar();
    }, 120);
  };

  const done = () => {
    if (!visibleRef.current) return;

    clearTimer();
    clearHideTimer();
    finishingRef.current = true;
    widthRef.current = 100;
    syncBar();

    hideTimerRef.current = window.setTimeout(() => {
      visibleRef.current = false;
      widthRef.current = 0;
      finishingRef.current = false;
      hideTimerRef.current = null;
      syncBar();
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
      clearTimer();
      clearHideTimer();
    };
  }, []);

  useEffect(() => {
    if (pathname === currentPathRef.current) return;

    currentPathRef.current = pathname;
    done();
  }, [pathname]);

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[9999]">
      <div
        ref={barRef}
        className="h-[2px] w-0 bg-sky-500 opacity-0 transition-[width,opacity] duration-200 ease-out"
      />
    </div>
  );
};
