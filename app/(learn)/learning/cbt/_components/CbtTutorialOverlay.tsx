"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { RotateCcw, X } from "lucide-react";

import { cn } from "@/lib/utils";

interface CbtTutorialOverlayProps {
  targetSelector: string | null;
  stepNumber: number;
  totalSteps: number;
  title: string;
  description: string;
  onExit: () => void;
  onNext?: () => void;
  nextDisabled?: boolean;
  completed?: boolean;
  onRestart?: () => void;
  onFinish?: () => void;
}

interface Rect {
  left: number;
  top: number;
  width: number;
  height: number;
}

function viewportRect(): Rect {
  const viewport = window.visualViewport;
  return {
    left: viewport?.offsetLeft ?? 0,
    top: viewport?.offsetTop ?? 0,
    width: viewport?.width ?? window.innerWidth,
    height: viewport?.height ?? window.innerHeight,
  };
}

function visibleTargetRect(element: HTMLElement, viewport: Rect): Rect | null {
  const bounds = element.getBoundingClientRect();
  let left = Math.max(viewport.left + 6, bounds.left - 6);
  let top = Math.max(viewport.top + 6, bounds.top - 6);
  let right = Math.min(viewport.left + viewport.width - 6, bounds.right + 6);
  let bottom = Math.min(viewport.top + viewport.height - 6, bounds.bottom + 6);

  // Player questions scroll inside their own pane, rather than the document.
  for (
    let parent = element.parentElement;
    parent;
    parent = parent.parentElement
  ) {
    const style = window.getComputedStyle(parent);
    const clipsX = /auto|scroll|hidden|clip/.test(style.overflowX);
    const clipsY = /auto|scroll|hidden|clip/.test(style.overflowY);
    if (!clipsX && !clipsY) continue;
    const box = parent.getBoundingClientRect();
    if (clipsX) {
      left = Math.max(left, box.left + parent.clientLeft);
      right = Math.min(
        right,
        box.left + parent.clientLeft + parent.clientWidth,
      );
    }
    if (clipsY) {
      top = Math.max(top, box.top + parent.clientTop);
      bottom = Math.min(
        bottom,
        box.top + parent.clientTop + parent.clientHeight,
      );
    }
  }

  return right > left && bottom > top
    ? { left, top, width: right - left, height: bottom - top }
    : null;
}

function nearestScroller(element: HTMLElement) {
  for (
    let parent = element.parentElement;
    parent;
    parent = parent.parentElement
  ) {
    if (
      /auto|scroll/.test(window.getComputedStyle(parent).overflowY) &&
      parent.scrollHeight > parent.clientHeight
    ) {
      return parent;
    }
  }
  return null;
}

function holePath(viewport: Rect, target: Rect | null) {
  const outside = `M 0 0 H ${viewport.width} V ${viewport.height} H 0 Z`;
  if (!target) return outside;
  const left = target.left - viewport.left;
  const top = target.top - viewport.top;
  const right = left + target.width;
  const bottom = top + target.height;
  const radius = Math.min(16, target.width / 2, target.height / 2);
  return `${outside} M ${left + radius} ${top} H ${right - radius} Q ${right} ${top} ${right} ${top + radius} V ${bottom - radius} Q ${right} ${bottom} ${right - radius} ${bottom} H ${left + radius} Q ${left} ${bottom} ${left} ${bottom - radius} V ${top + radius} Q ${left} ${top} ${left + radius} ${top} Z`;
}

const focusableSelector =
  'button, a[href], input, select, textarea, [contenteditable="true"], [tabindex]:not([tabindex="-1"])';

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

export function CbtTutorialOverlay({
  targetSelector,
  stepNumber,
  totalSteps,
  title,
  description,
  onExit,
  onNext,
  nextDisabled = false,
  completed = false,
  onRestart,
  onFinish,
}: CbtTutorialOverlayProps) {
  const titleId = useId();
  const descriptionId = useId();
  const guideRef = useRef<HTMLElement>(null);
  const exitRef = useRef(onExit);
  exitRef.current = onExit;
  const [mounted, setMounted] = useState(false);
  const [viewport, setViewport] = useState<Rect>({
    left: 0,
    top: 0,
    width: 0,
    height: 0,
  });
  const [target, setTarget] = useState<HTMLElement | null>(null);
  const [spotlight, setSpotlight] = useState<Rect | null>(null);
  const [guideTop, setGuideTop] = useState(16);

  useEffect(() => {
    const previousFocus = document.activeElement;
    const viewport = viewportRect();
    setViewport(viewport);
    setGuideTop(Math.max(16, viewport.height - 200 - 16));
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
    let needsPosition = true;
    let motionUntil = performance.now() + 500;
    const resizeObserver = new ResizeObserver((entries) => {
      if (entries.some((entry) => entry.target === guideRef.current)) {
        needsPosition = true;
      }
      scheduleMeasure();
    });

    const measure = () => {
      frame = null;
      const viewport = viewportRect();
      setViewport((previous) =>
        Object.keys(viewport).every(
          (key) => previous[key as keyof Rect] === viewport[key as keyof Rect],
        )
          ? previous
          : viewport,
      );
      const element = targetSelector
        ? document.querySelector<HTMLElement>(targetSelector)
        : null;
      if (element !== observedTarget) {
        if (observedTarget) resizeObserver.unobserve(observedTarget);
        observedTarget = element;
        setTarget(element);
        needsPosition = true;
        if (element) {
          resizeObserver.observe(element);
          motionUntil = performance.now() + 500;
        }
      }
      if (element && needsPosition) {
        element.scrollIntoView({
          block: "nearest",
          inline: "nearest",
          behavior: "instant",
        });
      }
      let rect = element ? visibleTargetRect(element, viewport) : null;
      const panelHeight = Math.min(
        guideRef.current?.getBoundingClientRect().height ?? 200,
        viewport.height - 32,
      );
      const panelWidth = Math.min(416, viewport.width - 32);
      const panelLeft = viewport.left + (viewport.width - panelWidth) / 2;
      const above = 16;
      const below = Math.max(16, viewport.height - panelHeight - 16);
      const overlap = (top: number) => {
        if (!rect) return 0;
        const overlapX = Math.max(
          0,
          Math.min(panelLeft + panelWidth, rect.left + rect.width) -
            Math.max(panelLeft, rect.left),
        );
        const overlapY = Math.max(
          0,
          Math.min(viewport.top + top + panelHeight, rect.top + rect.height) -
            Math.max(viewport.top + top, rect.top),
        );
        return overlapX * overlapY;
      };
      const chooseTop = () =>
        element?.closest('[role="dialog"]')
          ? above
          : overlap(above) < overlap(below)
            ? above
            : below;
      let top = chooseTop();

      if (element && rect && needsPosition && overlap(top) > 0) {
        const scroller = nearestScroller(element);
        if (scroller) {
          const bounds = element.getBoundingClientRect();
          const shift =
            top === above
              ? bounds.top - (viewport.top + top + panelHeight + 12)
              : bounds.bottom - (viewport.top + top - 12);
          scroller.scrollBy({ top: shift, behavior: "instant" });
          rect = visibleTargetRect(element, viewport);
          top = chooseTop();
        }
      }
      needsPosition = false;
      setGuideTop(top);
      setSpotlight((previous) =>
        previous?.left === rect?.left &&
        previous?.top === rect?.top &&
        previous?.width === rect?.width &&
        previous?.height === rect?.height
          ? previous
          : rect,
      );
      if (performance.now() < motionUntil) scheduleMeasure();
    };

    function scheduleMeasure() {
      if (frame === null) frame = window.requestAnimationFrame(measure);
    }
    const onViewportChange = () => {
      needsPosition = true;
      scheduleMeasure();
    };
    const onTargetMotion = (event: Event) => {
      if (
        !(event.target instanceof Node) ||
        !observedTarget?.contains(event.target)
      ) {
        return;
      }
      motionUntil = performance.now() + 500;
      scheduleMeasure();
    };
    const motionEvents = [
      "transitionrun",
      "transitionend",
      "animationstart",
      "animationend",
    ];
    motionEvents.forEach((eventName) =>
      document.addEventListener(eventName, onTargetMotion, true),
    );
    const mutationObserver = new MutationObserver(scheduleMeasure);
    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["data-cbt-tutorial", "hidden"],
    });
    if (guideRef.current) resizeObserver.observe(guideRef.current);
    window.addEventListener("resize", onViewportChange);
    window.addEventListener("scroll", scheduleMeasure, true);
    window.visualViewport?.addEventListener("resize", onViewportChange);
    window.visualViewport?.addEventListener("scroll", onViewportChange);
    scheduleMeasure();

    return () => {
      if (frame !== null) window.cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      mutationObserver.disconnect();
      motionEvents.forEach((eventName) =>
        document.removeEventListener(eventName, onTargetMotion, true),
      );
      window.removeEventListener("resize", onViewportChange);
      window.removeEventListener("scroll", scheduleMeasure, true);
      window.visualViewport?.removeEventListener("resize", onViewportChange);
      window.visualViewport?.removeEventListener("scroll", onViewportChange);
    };
  }, [mounted, targetSelector, stepNumber, completed]);

  useEffect(() => {
    if (!mounted) return;
    const controls = () => [
      ...(!completed ? focusableElements(target) : []),
      ...focusableElements(guideRef.current),
    ];
    const focusFirst = () => {
      const finish = completed
        ? guideRef.current?.querySelector<HTMLElement>(
            "[data-cbt-tutorial-finish]",
          )
        : null;
      (finish ?? controls()[0] ?? guideRef.current)?.focus({
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
        event.stopPropagation();
        exitRef.current();
        return;
      }
      if (event.key !== "Tab") return;
      const available = controls();
      if (!available.length) return;
      event.preventDefault();
      const index = available.findIndex(
        (element) => element === document.activeElement,
      );
      const next =
        (index + (event.shiftKey ? -1 : 1) + available.length) %
        available.length;
      available[next].focus({ preventScroll: true });
    };
    document.addEventListener("focusin", onFocus);
    document.addEventListener("keydown", onKeyDown, true);
    focusFirst();
    return () => {
      document.removeEventListener("focusin", onFocus);
      document.removeEventListener("keydown", onKeyDown, true);
    };
  }, [mounted, target, stepNumber, completed]);

  const compactGuide =
    !completed &&
    (viewport.height <= 450 ||
      (viewport.height <= 750 && Boolean(target?.closest('[role="dialog"]'))));

  if (!mounted) return null;

  return createPortal(
    <div className="pointer-events-none fixed inset-0 z-[80]">
      <svg
        aria-hidden="true"
        className="absolute"
        width={viewport.width}
        height={viewport.height}
        viewBox={`0 0 ${viewport.width || 1} ${viewport.height || 1}`}
        style={{ left: viewport.left, top: viewport.top }}
      >
        <path
          d={holePath(viewport, spotlight)}
          fill="rgba(0, 0, 0, 0.4)"
          fillRule="evenodd"
          pointerEvents="fill"
        />
      </svg>
      <aside
        ref={guideRef}
        role="region"
        tabIndex={-1}
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className={cn(
          "pointer-events-auto fixed w-[calc(100%_-_2rem)] max-w-[26rem] -translate-x-1/2 overflow-y-auto rounded-2xl bg-white text-foreground focus:outline-none",
          compactGuide ? "p-3" : "p-4 sm:p-5",
        )}
        style={{
          left: viewport.left + viewport.width / 2,
          top: viewport.top + guideTop,
          width: Math.min(416, Math.max(80, viewport.width - 32)),
          maxHeight: Math.max(80, viewport.height - 32),
        }}
      >
        <div
          className={cn(
            "flex items-center justify-between gap-3",
            compactGuide ? "mb-1" : "mb-2",
          )}
        >
          <span className="text-xs font-bold tabular-nums text-primary">
            {stepNumber} / {totalSteps}
          </span>
          <button
            type="button"
            onClick={onExit}
            className="-mr-1 -mt-1 flex min-h-9 items-center gap-1 rounded-lg px-2 text-xs text-muted-foreground hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <span className={compactGuide ? "sr-only" : undefined}>나가기</span>
            <X className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>
        <div aria-live="polite" aria-atomic="true">
          <h2
            id={titleId}
            className={cn(
              "font-extrabold",
              compactGuide
                ? "absolute left-16 right-12 top-4 text-xs leading-4"
                : "text-base",
            )}
          >
            {title}
          </h2>
          <p
            id={descriptionId}
            className={cn(
              "text-muted-foreground",
              compactGuide
                ? "mt-1 pr-24 text-xs leading-4"
                : "mt-2 text-sm leading-6",
            )}
          >
            {description}
          </p>
          {targetSelector && !target && (
            <p className="mt-2 text-xs text-muted-foreground">
              연습할 화면을 준비하고 있어요.
            </p>
          )}
        </div>
        <div
          className={cn(
            "flex items-center justify-end gap-2",
            compactGuide ? "absolute bottom-3 right-3" : "mt-4",
          )}
        >
          {completed ? (
            <>
              {onRestart && (
                <button
                  type="button"
                  onClick={onRestart}
                  className="flex min-h-11 items-center gap-1.5 rounded-xl bg-accent/50 px-3 text-xs font-bold text-primary hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                  다시 연습하기
                </button>
              )}
              <button
                type="button"
                data-cbt-tutorial-finish
                onClick={onFinish ?? onExit}
                className="min-h-11 rounded-xl bg-primary px-4 text-sm font-extrabold text-white hover:bg-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                연습 마치기
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onNext}
              disabled={!onNext || nextDisabled}
              className={cn(
                "min-h-11 rounded-xl bg-primary font-extrabold text-white hover:bg-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-default disabled:opacity-40",
                compactGuide
                  ? "min-w-20 px-4 text-xs"
                  : "min-w-24 px-5 text-sm",
              )}
            >
              다음
            </button>
          )}
        </div>
      </aside>
    </div>,
    document.body,
  );
}
