"use client";

import { Columns2, GitBranch, Loader2, RotateCcw, ScanEye } from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
  type MouseEvent,
  type ReactNode,
} from "react";

import { cn } from "@/lib/utils";
import type { BlindMask, Flashcard } from "@/types/flashcard";

const cardTypes = {
  relation: { label: "원인과 결과", icon: GitBranch },
  compare: { label: "비교 카드", icon: Columns2 },
  blind: { label: "이미지 카드", icon: ScanEye },
};

function CardContent({ children }: { children: ReactNode }) {
  return (
    <span className="flex w-full flex-1 flex-col items-center justify-center px-6 py-5 sm:px-10 sm:py-7">
      {children}
    </span>
  );
}

function TextContent({
  card,
  answer,
}: {
  card: Exclude<Flashcard, { type: "blind" }>;
  answer: boolean;
}) {
  const question =
    card.type === "concept"
      ? card.term
      : card.type === "relation"
        ? card.trigger
        : `${card.nameA} / ${card.nameB}`;
  const response =
    card.type === "concept"
      ? card.definition
      : card.type === "relation"
        ? card.effect
        : card.common;
  const detail =
    card.type === "relation"
      ? card.mechanism
      : card.type === "compare"
        ? card.difference
        : "";
  return (
    <>
      {answer && (
        <span className="mb-5 block text-xs font-semibold tracking-wide text-muted-foreground sm:mb-6">
          {question}
        </span>
      )}
      <span
        className={cn(
          "block w-full whitespace-pre-wrap break-words font-bold [overflow-wrap:anywhere]",
          answer ? "text-brand" : "text-foreground",
          answer
            ? response.length > 150
              ? "text-lg leading-8 sm:text-xl sm:leading-9"
              : "text-[1.5rem] leading-[1.65] sm:text-[1.75rem]"
            : question.length > 80
              ? "text-xl leading-9 sm:text-2xl sm:leading-10"
              : "text-[1.75rem] leading-[1.5] sm:text-[2.125rem]",
        )}
      >
        {answer ? response : question}
      </span>
      {answer && detail && (
        <span className="mt-7 block w-full text-left">
          <span className="mb-2 block text-xs font-bold text-brand">
            {card.type === "relation" ? "이렇게 연결돼요" : "이 점이 달라요"}
          </span>
          <span className="block whitespace-pre-wrap break-words text-sm font-medium leading-6 text-brand [overflow-wrap:anywhere] sm:text-base sm:leading-7">
            {detail}
          </span>
        </span>
      )}
    </>
  );
}

function StrokeMask({ mask }: { mask: BlindMask }) {
  if (!mask.points?.length) return null;

  const points = mask.points.map((point) => ({
    x: Math.min(
      100,
      Math.max(0, ((point.x - mask.x) / Math.max(mask.width, 0.001)) * 100),
    ),
    y: Math.min(
      100,
      Math.max(0, ((point.y - mask.y) / Math.max(mask.height, 0.001)) * 100),
    ),
  }));

  return (
    <svg
      aria-hidden="true"
      className="h-full w-full overflow-visible"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
    >
      {points.length === 1 ? (
        <circle
          cx={points[0].x}
          cy={points[0].y}
          r="5"
          fill="none"
          stroke="currentColor"
          strokeWidth="10"
          vectorEffect="non-scaling-stroke"
        />
      ) : (
        <polyline
          points={points.map((point) => `${point.x},${point.y}`).join(" ")}
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="10"
          vectorEffect="non-scaling-stroke"
        />
      )}
    </svg>
  );
}

function BlindContent({
  card,
  answer,
  revealed,
  onToggleMask,
  disabled,
}: {
  card: Extract<Flashcard, { type: "blind" }>;
  answer: boolean;
  revealed: Set<string>;
  onToggleMask: (id: string) => void;
  disabled: boolean;
}) {
  return (
    <div className="flex-1 px-5 py-4 sm:px-7">
      <p className="mb-3 break-words text-center text-sm font-semibold text-foreground">
        {card.title}
      </p>
      <div className="relative overflow-hidden rounded-xl bg-white">
        <img
          src={card.imageUrl}
          alt={card.title}
          draggable={false}
          className="block w-full"
        />
        {!answer &&
          card.masks.map((mask, index) => {
            const isRevealed = revealed.has(mask.id);
            const isStroke = Boolean(mask.points?.length);

            return (
              <button
                key={mask.id}
                type="button"
                disabled={disabled}
                aria-label={`${index + 1}번 가림막 ${isRevealed ? "다시 가리기" : "열기"}`}
                aria-pressed={isRevealed}
                onClick={(event) => {
                  event.stopPropagation();
                  onToggleMask(mask.id);
                }}
                className={cn(
                  "absolute focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
                  isRevealed &&
                    "border border-dashed border-brand/50 bg-transparent",
                  !isRevealed &&
                    !isStroke &&
                    "rounded-sm border border-white/70 bg-slate-900",
                  !isRevealed && isStroke && "text-slate-900",
                )}
                style={{
                  left: `${mask.x * 100}%`,
                  top: `${mask.y * 100}%`,
                  width: `${mask.width * 100}%`,
                  height: `${mask.height * 100}%`,
                }}
              >
                {!isRevealed && isStroke && <StrokeMask mask={mask} />}
              </button>
            );
          })}
      </div>
    </div>
  );
}

export function FlashcardStudyCard({
  card,
  positionLabel,
  saving = false,
  flipped,
  onFlip,
  disabled = false,
}: {
  card: Flashcard;
  positionLabel: string;
  saving?: boolean;
  flipped: boolean;
  onFlip: () => void;
  disabled?: boolean;
}) {
  const [revealedMasks, setRevealedMasks] = useState<Set<string>>(new Set());
  const flipControls = useRef<Array<HTMLButtonElement | null>>([]);
  const preserveFocus = useRef(false);
  const typeInfo = card.type === "concept" ? null : cardTypes[card.type];
  const TypeIcon = typeInfo?.icon;

  useEffect(() => {
    setRevealedMasks(new Set());
    if (preserveFocus.current) {
      flipControls.current[flipped ? 1 : 0]?.focus({ preventScroll: true });
      preserveFocus.current = false;
    }
  }, [card.id, flipped]);

  const handleFlip = (event: MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    if (disabled) return;
    preserveFocus.current = event.currentTarget === document.activeElement;
    onFlip();
  };

  const toggleMask = (id: string) => {
    setRevealedMasks((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="relative w-full [perspective:1400px]">
      <div
        className={cn(
          "relative w-full transition-transform duration-500 [transform-style:preserve-3d] [transition-timing-function:cubic-bezier(0.2,0.7,0.2,1)] motion-reduce:transition-none motion-reduce:[transform:none]",
          flipped && "[transform:rotateY(180deg)]",
        )}
      >
        {[false, true].map((answer) => {
          const inactive = answer !== flipped;
          return (
            <div
              key={answer ? "back" : "front"}
              aria-hidden={inactive}
              inert={inactive}
              onClick={card.type === "blind" ? handleFlip : undefined}
              className={cn(
                "flex w-full flex-col overflow-hidden rounded-[1.75rem] bg-accent [backface-visibility:hidden] motion-reduce:[transform:none] sm:rounded-[2rem]",
                answer && "[transform:rotateY(180deg)]",
                inactive
                  ? "pointer-events-none absolute inset-0 h-full motion-reduce:opacity-0"
                  : "relative min-h-[22rem] motion-reduce:opacity-100 sm:min-h-[25rem]",
              )}
            >
              <div className="flex shrink-0 items-center justify-between gap-3 px-5 pt-5 sm:px-7 sm:pt-6">
                {typeInfo && TypeIcon && (
                  <span className="inline-flex items-center gap-1.5 py-1.5 text-[11px] font-medium text-muted-foreground sm:text-xs">
                    <TypeIcon
                      aria-hidden="true"
                      className="h-3.5 w-3.5"
                      strokeWidth={1.8}
                    />
                    {typeInfo.label}
                  </span>
                )}
                <span
                  aria-hidden="true"
                  className="ml-auto inline-flex shrink-0 items-center gap-2 py-1.5 text-xs font-medium tabular-nums text-muted-foreground"
                >
                  {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  {positionLabel}
                </span>
              </div>

              {card.type === "blind" ? (
                <>
                  <BlindContent
                    card={card}
                    answer={answer}
                    revealed={revealedMasks}
                    onToggleMask={toggleMask}
                    disabled={disabled}
                  />
                  <button
                    ref={(node) => {
                      flipControls.current[answer ? 1 : 0] = node;
                    }}
                    type="button"
                    disabled={disabled}
                    onClick={handleFlip}
                    aria-label={answer ? "카드 앞면 보기" : "카드 정답 보기"}
                    className="mx-auto mb-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand disabled:cursor-wait"
                  >
                    <RotateCcw
                      aria-hidden="true"
                      className="h-5 w-5"
                      strokeWidth={1.8}
                    />
                  </button>
                </>
              ) : (
                <button
                  ref={(node) => {
                    flipControls.current[answer ? 1 : 0] = node;
                  }}
                  type="button"
                  disabled={disabled}
                  onClick={handleFlip}
                  className="flex w-full flex-1 flex-col text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand disabled:cursor-wait"
                >
                  <CardContent>
                    <TextContent card={card} answer={answer} />
                  </CardContent>
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
