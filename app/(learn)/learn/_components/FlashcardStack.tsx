"use client";

import { useEffect, useRef, useState, type PointerEvent } from "react";

import { cn } from "@/lib/utils";
import type { Flashcard } from "@/types/flashcard";

import { FlashcardStudyCard } from "./FlashcardStudyCard";

export function FlashcardStack({
  card,
  positionLabel,
  saving = false,
  flipped,
  onFlip,
  onSwipe,
  disabled = false,
  direction = "next",
}: {
  card: Flashcard;
  positionLabel: string;
  saving?: boolean;
  flipped: boolean;
  onFlip: () => void;
  onSwipe: (direction: "left" | "right") => void;
  disabled?: boolean;
  direction?: "next" | "previous";
}) {
  const gesture = useRef<{ x: number; y: number; id: number } | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const suppressClick = useRef(false);
  const wheelGesture = useRef({ distance: 0, triggered: false });
  const wheelResetTimer = useRef<number | null>(null);
  const latestProps = useRef({ disabled, onSwipe });
  latestProps.current = { disabled, onSwipe };
  const [dragX, setDragX] = useState(0);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const handleWheel = (event: WheelEvent) => {
      if (
        event.ctrlKey ||
        (event.target as Element).closest("[data-no-swipe]") ||
        Math.abs(event.deltaX) <= Math.abs(event.deltaY)
      ) {
        return;
      }

      if (wheelResetTimer.current !== null) {
        window.clearTimeout(wheelResetTimer.current);
      }
      wheelResetTimer.current = window.setTimeout(() => {
        wheelGesture.current = { distance: 0, triggered: false };
        wheelResetTimer.current = null;
      }, 250);

      event.preventDefault();
      if (latestProps.current.disabled || gesture.current) {
        wheelGesture.current.triggered = true;
        return;
      }

      if (wheelGesture.current.triggered) return;

      const unit =
        event.deltaMode === 1
          ? 16
          : event.deltaMode === 2
            ? stage.clientWidth
            : 1;
      const distance = event.deltaX * unit;
      const previous = wheelGesture.current.distance;
      wheelGesture.current.distance =
        Math.sign(previous) === Math.sign(distance)
          ? previous + distance
          : distance;
      if (Math.abs(wheelGesture.current.distance) < 64) return;

      wheelGesture.current.triggered = true;
      latestProps.current.onSwipe(distance > 0 ? "left" : "right");
    };

    stage.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      stage.removeEventListener("wheel", handleWheel);
      if (wheelResetTimer.current !== null) {
        window.clearTimeout(wheelResetTimer.current);
        wheelResetTimer.current = null;
      }
      wheelGesture.current = { distance: 0, triggered: false };
    };
  }, []);

  const resetGesture = () => {
    const start = gesture.current;
    gesture.current = null;
    setDragX(0);
    if (start && stageRef.current?.hasPointerCapture(start.id)) {
      stageRef.current.releasePointerCapture(start.id);
    }
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    suppressClick.current = false;
    if (
      disabled ||
      !event.isPrimary ||
      event.button !== 0 ||
      (event.target as HTMLElement).closest("[data-no-swipe]")
    ) {
      return;
    }

    gesture.current = {
      x: event.clientX,
      y: event.clientY,
      id: event.pointerId,
    };
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const start = gesture.current;
    if (!start || start.id !== event.pointerId) return;
    if (disabled) {
      suppressClick.current = false;
      resetGesture();
      return;
    }

    const x = event.clientX - start.x;
    const y = event.clientY - start.y;
    if (Math.abs(y) > 14 && Math.abs(y) > Math.abs(x)) {
      suppressClick.current = false;
      resetGesture();
      return;
    }

    if (Math.abs(x) > 10) {
      suppressClick.current = true;
      event.currentTarget.setPointerCapture(event.pointerId);
      setDragX(Math.max(-140, Math.min(140, x)));
    }
  };

  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const start = gesture.current;
    resetGesture();
    if (!start || start.id !== event.pointerId || disabled) return;

    const x = event.clientX - start.x;
    const y = event.clientY - start.y;
    if (Math.abs(x) >= 64 && Math.abs(x) > Math.abs(y)) {
      suppressClick.current = true;
      onSwipe(x < 0 ? "left" : "right");
    }
  };

  return (
    <div className="relative mx-auto w-full max-w-[34rem] px-2 pb-5 pt-3 sm:px-3">
      <div
        ref={stageRef}
        data-flashcard-tutorial="card"
        role="group"
        aria-roledescription="카드 넘기기"
        aria-label="플래시카드, 좌우 방향키로 넘기기"
        tabIndex={disabled ? -1 : 0}
        className="relative touch-pan-y select-none rounded-[1.75rem] transition-transform duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand motion-reduce:transition-none sm:rounded-[2rem]"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={() => {
          suppressClick.current = false;
          resetGesture();
        }}
        onLostPointerCapture={(event) => {
          if (event.target === event.currentTarget) resetGesture();
        }}
        onClickCapture={(event) => {
          if (!suppressClick.current || event.detail === 0) return;
          event.preventDefault();
          event.stopPropagation();
          suppressClick.current = false;
        }}
        style={{
          transform: `translateX(${dragX}px)`,
          transition: dragX ? "none" : undefined,
        }}
      >
        <div
          key={card.id}
          className={cn(
            "motion-safe:duration-300 motion-safe:animate-in motion-safe:fade-in",
            direction === "next"
              ? "motion-safe:slide-in-from-right-6"
              : "motion-safe:slide-in-from-left-6",
          )}
        >
          <FlashcardStudyCard
            card={card}
            positionLabel={positionLabel}
            saving={saving}
            flipped={flipped}
            onFlip={onFlip}
            disabled={disabled}
          />
        </div>
      </div>
    </div>
  );
}
