"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export const TopRouteProgress = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [visible, setVisible] = useState(false);
  const [width, setWidth] = useState(0);

  const timerRef = useRef<number | null>(null);
  const finishingRef = useRef(false);

  const clearTimer = () => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const start = () => {
    if (finishingRef.current) return;

    clearTimer();
    setVisible(true);
    setWidth(18);

    timerRef.current = window.setInterval(() => {
      setWidth((prev) => {
        if (prev >= 88) return prev;
        if (prev < 40) return prev + 12;
        if (prev < 70) return prev + 6;
        return prev + 2;
      });
    }, 120);
  };

  const done = () => {
    clearTimer();
    finishingRef.current = true;
    setWidth(100);

    window.setTimeout(() => {
      setVisible(false);
      setWidth(0);
      finishingRef.current = false;
    }, 220);
  };

  useEffect(() => {
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

      const isSameOrigin = url.origin === current.origin;
      const isSameUrl =
        url.pathname === current.pathname &&
        url.search === current.search &&
        url.hash === current.hash;

      if (!isSameOrigin || isSameUrl) return;

      start();
    };

    const handlePopState = () => {
      start();
    };

    document.addEventListener("click", handleClick, true);
    window.addEventListener("popstate", handlePopState);

    return () => {
      document.removeEventListener("click", handleClick, true);
      window.removeEventListener("popstate", handlePopState);
      clearTimer();
    };
  }, []);

  useEffect(() => {
    done();
  }, [pathname, searchParams]);

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[9999]">
      <div
        className="h-[2px] bg-sky-500 transition-[width,opacity] duration-200 ease-out"
        style={{
          width: `${width}%`,
          opacity: visible ? 1 : 0,
        }}
      />
    </div>
  );
}