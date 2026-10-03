"use client";

import { useEffect, useId, useRef, useState, type PointerEvent } from "react";
import { createPortal } from "react-dom";
import { Loader2, RotateCcw, X } from "lucide-react";

interface FlashcardTutorialOverlayProps {
  targetSelector: string;
  stepNumber: number;
  totalSteps: number;
  title: string;
  description: string;
  onExit: () => void;
  onRestart?: () => void;
  completed?: boolean;
  onFinish?: () => void;
  onNext?: () => void;
  nextDisabled?: boolean;
}

interface Spotlight {
  left: number;
  top: number;
  width: number;
  height: number;
}

const focusableSelector =
  'button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

function focusableElements(container: HTMLElement | null) {
  if (!container) return [];
  const elements = Array.from(
    container.querySelectorAll<HTMLElement>(focusableSelector),
  );
  if (container.matches(focusableSelector)) elements.unshift(container);
  return elements.filter(
    (element) =>
      element.tabIndex >= 0 &&
      !element.matches(":disabled") &&
      !element.closest('[aria-hidden="true"], [inert]') &&
      element.getClientRects().length > 0,
  );
}

function spotlightPath(
  viewport: { width: number; height: number },
  spotlight: Spotlight | null,
) {
  const outside = `M 0 0 H ${viewport.width} V ${viewport.height} H 0 Z`;
  if (!spotlight) return outside;
  const { left, top, width, height } = spotlight;
  const right = left + width;
  const bottom = top + height;
  const radius = Math.min(24, width / 2, height / 2);
  return `${outside} M ${left + radius} ${top} H ${right - radius} Q ${right} ${top} ${right} ${top + radius} V ${bottom - radius} Q ${right} ${bottom} ${right - radius} ${bottom} H ${left + radius} Q ${left} ${bottom} ${left} ${bottom - radius} V ${top + radius} Q ${left} ${top} ${left + radius} ${top} Z`;
}

export function FlashcardTutorialOverlay({
  targetSelector,
  stepNumber,
  totalSteps,
  title,
  description,
  onExit,
  onRestart,
  completed = false,
  onFinish,
  onNext,
  nextDisabled = false,
}: FlashcardTutorialOverlayProps) {
  const titleId = useId();
  const descriptionId = useId();
  const guideRef = useRef<HTMLElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const guideGesture = useRef<{
    x: number;
    y: number;
    id: number;
    step: number;
  } | null>(null);
  const latestCallbacks = useRef({ onExit });
  latestCallbacks.current = { onExit };
  const [mounted, setMounted] = useState(false);
  const [target, setTarget] = useState<HTMLElement | null>(null);
  const [spotlight, setSpotlight] = useState<Spotlight | null>(null);
  const [viewport, setViewport] = useState({ width: 0, height: 0 });

  const resetGuideGesture = () => {
    const start = guideGesture.current;
    guideGesture.current = null;
    if (start && overlayRef.current?.hasPointerCapture(start.id)) {
      overlayRef.current.releasePointerCapture(start.id);
    }
  };

  const handleGuidePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (
      !onNext ||
      completed ||
      nextDisabled ||
      !event.isPrimary ||
      event.button !== 0 ||
      (event.target as Element).closest(
        "button, a, input, textarea, select, [contenteditable]",
      )
    ) {
      return;
    }
    guideGesture.current = {
      x: event.clientX,
      y: event.clientY,
      id: event.pointerId,
      step: stepNumber,
    };
  };

  const handleGuidePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const start = guideGesture.current;
    if (!start || start.id !== event.pointerId) return;
    if (completed || nextDisabled || !onNext || start.step !== stepNumber) {
      resetGuideGesture();
      return;
    }
    const x = Math.abs(event.clientX - start.x);
    const y = Math.abs(event.clientY - start.y);
    if (y > 14 && y >= x) {
      resetGuideGesture();
      return;
    }
    if (x > 10 && x > y) {
      event.currentTarget.setPointerCapture(event.pointerId);
    }
  };

  const handleGuidePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const start = guideGesture.current;
    resetGuideGesture();
    if (
      !start ||
      start.id !== event.pointerId ||
      start.step !== stepNumber ||
      completed ||
      nextDisabled ||
      !onNext
    ) {
      return;
    }
    const x = event.clientX - start.x;
    const y = event.clientY - start.y;
    if (x <= -64 && Math.abs(x) > Math.abs(y)) onNext();
  };

  useEffect(() => {
    const previousFocus = document.activeElement;
    setMounted(true);
    return () => {
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) {
        previousFocus.focus({ preventScroll: true });
      }
    };
  }, []);

  useEffect(() => {
    if (!mounted) return;
    let frame: number | null = null;
    let observedTarget: HTMLElement | null = null;
    let positioned = false;
    let motionUntil = performance.now() + 600;
    const resizeObserver = new ResizeObserver((entries) => {
      if (entries.some((entry) => entry.target === guideRef.current)) {
        positioned = false;
      }
      scheduleMeasure();
    });

    const measure = () => {
      frame = null;
      const width = window.innerWidth;
      const height = window.innerHeight;
      setViewport((previous) =>
        previous.width === width && previous.height === height
          ? previous
          : { width, height },
      );

      const element = document.querySelector<HTMLElement>(targetSelector);
      if (element !== observedTarget) {
        if (observedTarget) resizeObserver.unobserve(observedTarget);
        observedTarget = element;
        setTarget(element);
        positioned = false;
        if (element) {
          resizeObserver.observe(element);
          motionUntil = Math.max(motionUntil, performance.now() + 600);
        }
      }

      if (!element || !element.getClientRects().length) {
        setSpotlight(null);
        if (performance.now() < motionUntil) scheduleMeasure();
        return;
      }

      let bounds = element.getBoundingClientRect();
      const guide = guideRef.current;
      if (!positioned && guide) {
        positioned = true;
        const availableBottom = Math.max(
          32,
          guide.getBoundingClientRect().top - 20,
        );
        const availableTop = Math.max(
          8,
          Math.min(80, height / 5, availableBottom - 48),
        );
        const availableHeight = availableBottom - availableTop;
        const desiredTop =
          availableTop +
          (availableHeight - bounds.height) / 2 -
          (bounds.height > availableHeight ? 24 : 0);
        if (bounds.top < availableTop || bounds.bottom > availableBottom) {
          // On short screens, keep the card's central content above the guide.
          // The page remains scrollable to reach the rest of a long card.
          window.scrollBy({
            top: bounds.top - desiredTop,
            behavior: "instant",
          });
          bounds = element.getBoundingClientRect();
        }
      }

      const left = Math.max(8, bounds.left - 8);
      const top = Math.max(8, bounds.top - 8);
      const right = Math.min(width - 8, bounds.right + 8);
      const bottom = Math.min(height - 8, bounds.bottom + 8);
      const next =
        right > left && bottom > top
          ? {
              left: Math.round(left),
              top: Math.round(top),
              width: Math.round(right - left),
              height: Math.round(bottom - top),
            }
          : null;
      setSpotlight((previous) =>
        previous?.left === next?.left &&
        previous?.top === next?.top &&
        previous?.width === next?.width &&
        previous?.height === next?.height
          ? previous
          : next,
      );
      if (performance.now() < motionUntil) scheduleMeasure();
    };

    const scheduleMeasure = () => {
      if (frame === null) frame = window.requestAnimationFrame(measure);
    };

    const concernsTarget = (event: Event) => {
      const element =
        observedTarget ?? document.querySelector<HTMLElement>(targetSelector);
      return event.target instanceof Node && element?.contains(event.target);
    };
    const trackTargetMotion = (event: Event) => {
      if (!concernsTarget(event)) return;
      if (
        event.type === "pointermove" &&
        (event as globalThis.PointerEvent).buttons === 0
      ) {
        return;
      }
      motionUntil = performance.now() + 600;
      scheduleMeasure();
    };
    const finishTargetMotion = (event: Event) => {
      if (!concernsTarget(event)) return;
      motionUntil = Math.max(motionUntil, performance.now() + 50);
      scheduleMeasure();
    };
    const motionStartEvents = [
      "pointerdown",
      "pointermove",
      "pointerup",
      "transitionrun",
      "animationstart",
    ];
    const motionEndEvents = [
      "pointercancel",
      "transitionend",
      "transitioncancel",
      "animationend",
      "animationcancel",
    ];
    motionStartEvents.forEach((eventName) =>
      document.addEventListener(eventName, trackTargetMotion, true),
    );
    motionEndEvents.forEach((eventName) =>
      document.addEventListener(eventName, finishTargetMotion, true),
    );

    const mutationObserver = new MutationObserver(scheduleMeasure);
    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["data-flashcard-tutorial"],
    });
    if (guideRef.current) resizeObserver.observe(guideRef.current);
    window.addEventListener("resize", scheduleMeasure);
    window.addEventListener("scroll", scheduleMeasure, true);
    window.visualViewport?.addEventListener("resize", scheduleMeasure);
    scheduleMeasure();

    return () => {
      if (frame !== null) window.cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      mutationObserver.disconnect();
      motionStartEvents.forEach((eventName) =>
        document.removeEventListener(eventName, trackTargetMotion, true),
      );
      motionEndEvents.forEach((eventName) =>
        document.removeEventListener(eventName, finishTargetMotion, true),
      );
      window.removeEventListener("resize", scheduleMeasure);
      window.removeEventListener("scroll", scheduleMeasure, true);
      window.visualViewport?.removeEventListener("resize", scheduleMeasure);
    };
  }, [mounted, targetSelector, stepNumber, completed]);

  useEffect(() => {
    if (!mounted) return;
    const availableControls = () => [
      ...(!completed ? focusableElements(target) : []),
      ...focusableElements(guideRef.current),
    ];
    const focusFirst = () => {
      const finishButton = completed
        ? guideRef.current?.querySelector<HTMLButtonElement>(
            "[data-tutorial-finish]",
          )
        : null;
      (finishButton ?? availableControls()[0] ?? guideRef.current)?.focus({
        preventScroll: true,
      });
    };
    const onFocus = (event: FocusEvent) => {
      if (!(event.target instanceof Node)) return;
      if (
        (!completed && target?.contains(event.target)) ||
        guideRef.current?.contains(event.target)
      ) {
        return;
      }
      focusFirst();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        latestCallbacks.current.onExit();
        return;
      }
      if (event.key !== "Tab") return;
      const controls = availableControls();
      if (!controls.length) return;
      event.preventDefault();
      const index = controls.findIndex(
        (control) => control === document.activeElement,
      );
      const nextIndex =
        (index + (event.shiftKey ? -1 : 1) + controls.length) % controls.length;
      controls[nextIndex].focus({ preventScroll: true });
    };
    document.addEventListener("focusin", onFocus);
    document.addEventListener("keydown", onKeyDown);
    focusFirst();
    return () => {
      document.removeEventListener("focusin", onFocus);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [mounted, target, stepNumber, completed]);

  if (!mounted) return null;

  return createPortal(
    <div
      ref={overlayRef}
      className="pointer-events-none fixed inset-0 z-50 touch-pan-y select-none"
      onPointerDown={handleGuidePointerDown}
      onPointerMove={handleGuidePointerMove}
      onPointerUp={handleGuidePointerUp}
      onPointerCancel={resetGuideGesture}
      onLostPointerCapture={(event) => {
        if (event.target === event.currentTarget) resetGuideGesture();
      }}
    >
      <svg
        aria-hidden="true"
        className="absolute inset-0 h-full w-full"
        width={viewport.width}
        height={viewport.height}
        viewBox={`0 0 ${viewport.width || 1} ${viewport.height || 1}`}
      >
        <path
          d={spotlightPath(viewport, spotlight)}
          fill="rgba(0, 0, 0, 0.3)"
          fillRule="evenodd"
          pointerEvents="fill"
        />
      </svg>

      <aside
        ref={guideRef}
        role="region"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        tabIndex={-1}
        className="pointer-events-auto fixed left-1/2 w-[calc(100%_-_2rem)] max-w-[26rem] -translate-x-1/2 rounded-3xl bg-white p-5 text-foreground focus:outline-none sm:p-6 [@media(max-height:450px)]:p-3 [@media(min-height:451px)_and_(max-height:650px)]:p-4"
        style={{ bottom: "calc(1rem + env(safe-area-inset-bottom))" }}
      >
        <div className="mb-2 flex items-center justify-between gap-4 [@media(max-height:450px)]:mb-1">
          <span className="text-xs font-bold tabular-nums text-brand">
            {Math.min(stepNumber, totalSteps)} / {totalSteps}
          </span>
          <button
            type="button"
            onClick={onExit}
            className="-mr-2 -mt-2 flex min-h-10 items-center gap-1 rounded-xl px-2 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand [@media(max-height:450px)]:min-h-8"
          >
            <span className="[@media(max-height:450px)]:sr-only">나가기</span>
            <X className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>
        <div aria-live="polite" aria-atomic="true">
          <h2
            id={titleId}
            className="text-base font-bold sm:text-lg [@media(max-height:450px)]:absolute [@media(max-height:450px)]:left-12 [@media(max-height:450px)]:right-12 [@media(max-height:450px)]:top-4 [@media(max-height:450px)]:text-xs [@media(max-height:450px)]:leading-4"
          >
            {title}
          </h2>
          <p
            id={descriptionId}
            className="mt-2 text-sm leading-6 text-muted-foreground [@media(max-height:450px)]:leading-4 [@media(max-height:650px)]:mt-1 [@media(max-height:650px)]:text-xs [@media(min-height:451px)_and_(max-height:650px)]:leading-5"
          >
            {target ? description : "연습할 화면을 준비하고 있어요."}
          </p>
          {!target && (
            <Loader2
              className="mt-3 h-4 w-4 animate-spin text-brand"
              aria-hidden="true"
            />
          )}
        </div>

        {!completed && (
          <div className="mt-4 flex justify-end [@media(max-height:450px)]:mt-2">
            <button
              type="button"
              onClick={onNext}
              disabled={!onNext || nextDisabled || !target}
              className="min-h-11 min-w-24 rounded-xl bg-brand px-5 text-sm font-bold text-white transition-colors hover:bg-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-40"
            >
              다음
            </button>
          </div>
        )}

        {completed && (
          <div className="mt-4 flex items-center gap-3">
            {onRestart && (
              <button
                type="button"
                onClick={onRestart}
                className="flex min-h-11 shrink-0 items-center gap-1.5 rounded-xl px-3 text-xs font-bold text-brand transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                다시 해보기
              </button>
            )}
            <button
              type="button"
              data-tutorial-finish
              onClick={onFinish ?? onExit}
              className="min-h-11 flex-1 rounded-xl bg-brand px-4 text-sm font-bold text-white transition-colors hover:bg-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
            >
              내 카드로 학습하기
            </button>
          </div>
        )}
      </aside>
    </div>,
    document.body,
  );
}
