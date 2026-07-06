"use client";

import { CSSProperties, useEffect, useMemo, useRef } from "react";
import { cn } from "@/lib/utils";

export const PILL_LOADER_SPRITE_SRC = "/illustrations/pill-loader-sprite.png";

type CssSize = number | string;

export interface PillLoaderProps {
  className?: string;
  style?: CSSProperties;
  size?: CssSize;
  duration?: number;
  src?: string;
  columns?: number;
  rows?: number;
  frameCount?: number;
  label?: string;
  decorative?: boolean;
  paused?: boolean;
}

const toCssSize = (size: CssSize) =>
  typeof size === "number" ? `${size}px` : size;

const getSafeCount = (value: number, fallback: number) =>
  Number.isFinite(value) ? Math.max(1, Math.floor(value)) : fallback;

const getFramePosition = (frame: number, columns: number, rows: number) => {
  const column = frame % columns;
  const row = Math.floor(frame / columns);
  const x = columns === 1 ? 0 : (column / (columns - 1)) * 100;
  const y = rows === 1 ? 0 : (row / (rows - 1)) * 100;

  return `${x}% ${y}%`;
};

export function PillLoader({
  className,
  style,
  size = 64,
  duration = 900,
  src = PILL_LOADER_SPRITE_SRC,
  columns = 6,
  rows = 5,
  frameCount = 30,
  label = "로딩 중",
  decorative = false,
  paused = false,
}: PillLoaderProps) {
  const spriteRef = useRef<HTMLSpanElement | null>(null);
  const cssSize = toCssSize(size);

  const sprite = useMemo(() => {
    const safeColumns = getSafeCount(columns, 6);
    const safeRows = getSafeCount(rows, 5);
    const maxFrameCount = safeColumns * safeRows;
    const safeFrameCount = Math.min(
      getSafeCount(frameCount, maxFrameCount),
      maxFrameCount,
    );

    return {
      columns: safeColumns,
      rows: safeRows,
      frameCount: safeFrameCount,
      duration: Number.isFinite(duration) ? Math.max(120, duration) : 900,
    };
  }, [columns, duration, frameCount, rows]);

  useEffect(() => {
    const element = spriteRef.current;
    if (!element) return;

    const setFrame = (frame: number) => {
      element.style.backgroundPosition = getFramePosition(
        frame,
        sprite.columns,
        sprite.rows,
      );
    };

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (paused || prefersReducedMotion || sprite.frameCount <= 1) {
      setFrame(0);
      return;
    }

    let animationFrameId = 0;
    let previousFrame = -1;
    const startedAt = performance.now();
    const frameDuration = sprite.duration / sprite.frameCount;

    const tick = (now: number) => {
      const elapsed = (now - startedAt) % sprite.duration;
      const frame = Math.floor(elapsed / frameDuration);

      if (frame !== previousFrame) {
        previousFrame = frame;
        setFrame(frame);
      }

      animationFrameId = window.requestAnimationFrame(tick);
    };

    setFrame(0);
    animationFrameId = window.requestAnimationFrame(tick);

    return () => window.cancelAnimationFrame(animationFrameId);
  }, [paused, sprite]);

  return (
    <span
      ref={spriteRef}
      role={decorative ? undefined : "status"}
      aria-label={decorative ? undefined : label}
      aria-live={decorative ? undefined : "polite"}
      aria-busy={decorative ? undefined : true}
      aria-hidden={decorative ? true : undefined}
      className={cn("inline-block shrink-0 align-middle", className)}
      style={{
        ...style,
        width: cssSize,
        height: cssSize,
        backgroundImage: `url("${src}")`,
        backgroundPosition: "0% 0%",
        backgroundRepeat: "no-repeat",
        backgroundSize: `${sprite.columns * 100}% ${sprite.rows * 100}%`,
      }}
    />
  );
}
