"use client";

import Image from "next/image";
import Link from "next/link";
import {
  AlertCircle,
  BarChart3,
  BookOpen,
  Brain,
  ChevronLeft,
  Eraser,
  EyeOff,
  FileUp,
  Info,
  Loader2,
  PenLine,
  PlusCircle,
  Sparkles,
  Square,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import {
  ChangeEvent,
  Fragment,
  PointerEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { Toast } from "@/components/atoms";
import { AppShell } from "@/components/molecules";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getValidAccessToken } from "@/lib/client/fetch";
import {
  buildReviewLogs,
  createRemoteFlashcard,
  deleteRemoteFlashcard,
  fetchAllFlashcards,
  fetchAgainTodayFlashcards,
  fetchDueFlashcards,
  fetchFlashcardStats,
  fetchWeakFlashcards,
  mergeFlashcards,
  reviewRemoteFlashcard,
  type FlashcardStats,
} from "@/lib/flashcards/api";
import { cn } from "@/lib/utils";
import {
  createMaskId,
  downscaleImage,
  readFileAsDataUrl,
} from "@/lib/flashcards/storage";
import {
  getLatestRating,
  isDue,
  isWeakCard,
  ratingLabels,
  ratingToneClass,
} from "@/lib/flashcards/srs";
import type {
  BlindMask,
  CardType,
  Flashcard,
  FlashcardDraft,
  Rating,
  ReviewLog,
} from "@/types/flashcard";

type AppTab = "study" | "weak" | "create" | "blind" | "stats";
type CreateMode = "ai" | "manual";
type BlindTool = "box" | "pen" | "eraser";

const tabItems: Array<{
  key: AppTab;
  label: string;
  title: string;
  description: string;
  icon: typeof BookOpen;
}> = [
  {
    key: "study",
    label: "학습",
    title: "학습",
    description: "오늘의 카드를 복습해보세요.",
    icon: BookOpen,
  },
  {
    key: "weak",
    label: "취약",
    title: "취약 노트",
    description: "다시 보고 싶은 카드를 모아봤어요.",
    icon: AlertCircle,
  },
  {
    key: "create",
    label: "만들기",
    title: "카드 만들기",
    description: "AI로 자동 생성하거나 직접 만들어보세요.",
    icon: PlusCircle,
  },
  {
    key: "blind",
    label: "블라인드",
    title: "이미지 가림막",
    description: "구조식과 표 위에 가림막을 만들고 카드로 저장해요.",
    icon: EyeOff,
  },
  {
    key: "stats",
    label: "통계",
    title: "학습 통계",
    description: "Again 카드와 연속 학습 일수를 확인해요.",
    icon: BarChart3,
  },
];

const emptyConcept = { term: "", definition: "" };
const emptyRelation = { trigger: "", effect: "", mechanism: "" };
const emptyCompare = { nameA: "", nameB: "", common: "", difference: "" };

const cardTypeLabels: Record<CardType, string> = {
  concept: "개념",
  relation: "관계",
  compare: "비교",
  blind: "블라인드",
};

const ratingDescriptions: Record<Rating, string> = {
  again: "1분 후 다시",
  hard: "내일 복습",
  good: "적정 간격",
  easy: "긴 간격",
};

const weakFolderOrder: Rating[] = ["easy", "good", "hard", "again"];

const weakFolderDescriptions: Record<Rating, string> = {
  easy: "여유롭게 맞춘 카드",
  good: "기억해 낸 카드",
  hard: "긴가민가했던 카드",
  again: "다시 풀어야 할 카드",
};

type WeakFolders = Record<Rating, Flashcard[]>;

const createEmptyWeakFolders = (): WeakFolders => ({
  again: [],
  hard: [],
  good: [],
  easy: [],
});

function formatDueTime(card: Flashcard) {
  const diff = card.due - Date.now();
  if (diff <= 0) return "지금 학습";
  if (diff < 60 * 60 * 1000) return `${Math.ceil(diff / 60000)}분 후`;
  if (diff < 24 * 60 * 60 * 1000) {
    return `${Math.ceil(diff / (60 * 60 * 1000))}시간 후`;
  }

  return `${Math.ceil(diff / (24 * 60 * 60 * 1000))}일 후`;
}

function getCardTitle(card: Flashcard) {
  if (card.type === "concept") return card.term;
  if (card.type === "relation") return card.trigger;
  if (card.type === "compare") return `${card.nameA} vs ${card.nameB}`;
  return card.title;
}

function getCardSubtitle(card: Flashcard) {
  if (card.type === "concept") return card.definition;
  if (card.type === "relation") return card.effect;
  if (card.type === "compare") return card.common;
  return `${card.masks.length}개 가림막`;
}

const MIN_BLIND_MASK_SIZE = 0.03;
const STROKE_MASK_PADDING = 0.015;
const MIN_STROKE_POINT_DISTANCE = 0.006;

function isStrokeMask(mask: BlindMask) {
  return Array.isArray(mask.points) && mask.points.length > 0;
}

function getDistance(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function buildStrokeMask(
  id: string,
  points: Array<{ x: number; y: number }>,
): BlindMask {
  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const x = Math.max(0, minX - STROKE_MASK_PADDING);
  const y = Math.max(0, minY - STROKE_MASK_PADDING);

  return {
    id,
    x,
    y,
    width: Math.min(
      1 - x,
      Math.max(MIN_BLIND_MASK_SIZE, maxX - minX + STROKE_MASK_PADDING * 2),
    ),
    height: Math.min(
      1 - y,
      Math.max(MIN_BLIND_MASK_SIZE, maxY - minY + STROKE_MASK_PADDING * 2),
    ),
    points,
  };
}

function getStrokePointString(mask: BlindMask) {
  if (!mask.points?.length) return "";

  const width = Math.max(mask.width, 0.001);
  const height = Math.max(mask.height, 0.001);

  return mask.points
    .map((point) => {
      const x = Math.min(100, Math.max(0, ((point.x - mask.x) / width) * 100));
      const y = Math.min(100, Math.max(0, ((point.y - mask.y) / height) * 100));

      return `${x},${y}`;
    })
    .join(" ");
}

function StrokeMaskShape({ mask }: { mask: BlindMask }) {
  const points = getStrokePointString(mask);
  if (!points || !mask.points?.length) return null;

  if (mask.points.length === 1) {
    const [x, y] = points.split(",").map(Number);

    return (
      <svg
        aria-hidden="true"
        className="h-full w-full overflow-visible"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <circle
          cx={x}
          cy={y}
          r="5"
          fill="none"
          stroke="currentColor"
          strokeWidth="10"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    );
  }

  return (
    <svg
      aria-hidden="true"
      className="h-full w-full overflow-visible"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
    >
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="10"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

function getTodayKey(value = Date.now()) {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function useFlashcardData() {
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [logs, setLogs] = useState<ReviewLog[]>([]);
  const [againTodayCards, setAgainTodayCards] = useState<Flashcard[]>([]);
  const [weakFolders, setWeakFolders] = useState<WeakFolders>(
    createEmptyWeakFolders,
  );
  const [stats, setStats] = useState<FlashcardStats | null>(null);
  const [ready, setReady] = useState(false);
  const [toast, setToast] = useState("");

  const applyCards = (nextCards: Flashcard[]) => {
    setCards(nextCards);
    setLogs(buildReviewLogs(nextCards));
  };

  const refresh = async ({ showLoading = false } = {}) => {
    if (showLoading) setReady(false);

    try {
      const [allCards, dueCards, againCards, nextStats, weakEntries] =
        await Promise.all([
          fetchAllFlashcards(),
          fetchDueFlashcards(),
          fetchAgainTodayFlashcards(),
          fetchFlashcardStats(),
          Promise.all(
            weakFolderOrder.map(async (rating) => {
              const folderCards = await fetchWeakFlashcards(rating);
              return [rating, folderCards] as const;
            }),
          ),
        ]);
      const nextWeakFolders = weakEntries.reduce<WeakFolders>(
        (acc, [rating, folderCards]) => {
          acc[rating] = folderCards;
          return acc;
        },
        createEmptyWeakFolders(),
      );
      const nextCards = mergeFlashcards(
        allCards,
        dueCards,
        againCards,
        ...Object.values(nextWeakFolders),
      );

      applyCards(nextCards);
      setAgainTodayCards(againCards);
      setWeakFolders(nextWeakFolders);
      setStats(nextStats);
      return true;
    } catch (error) {
      setToast(
        error instanceof Error
          ? error.message
          : "플래시카드를 불러오지 못했어요.",
      );
      return false;
    } finally {
      if (showLoading) setReady(true);
    }
  };

  useEffect(() => {
    void refresh({ showLoading: true });
  }, []);

  return {
    cards,
    logs,
    againTodayCards,
    weakFolders,
    stats,
    ready,
    toast,
    setToast,
    setCards: applyCards,
    refresh,
  };
}

function FlashcardShellHeader() {
  return (
    <header className="sticky top-0 z-20 flex h-[5.625rem] items-center justify-between border-b border-border/30 bg-white/95 px-6 backdrop-blur-xl">
      <Link href="/" aria-label="홈으로 이동" className="flex items-center">
        <Image
          src="/brand/PillChat.svg"
          alt="PillChat"
          width={82}
          height={32}
          priority
        />
      </Link>
      <div className="flex items-center gap-3">
        <Link
          href="/notifications"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-980 text-brand"
          aria-label="알림"
        >
          <AlertCircle aria-hidden="true" className="h-5 w-5" />
        </Link>
        <Link
          href="/mypage"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-980 text-brand"
          aria-label="마이페이지"
        >
          <UserRound aria-hidden="true" className="h-5 w-5" />
        </Link>
      </div>
    </header>
  );
}

function RatingBar({
  disabled,
  onRate,
}: {
  disabled?: boolean;
  onRate: (rating: Rating) => void;
}) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {(["again", "hard", "good", "easy"] as Rating[]).map((rating) => (
        <button
          key={rating}
          type="button"
          disabled={disabled}
          onClick={() => onRate(rating)}
          className={cn(
            "min-h-16 rounded-xl border px-2 py-2 text-center transition active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50",
            ratingToneClass[rating],
          )}
          aria-label={`${ratingLabels[rating]} 평가`}
        >
          <span className="block text-sm font-bold">
            {ratingLabels[rating]}
          </span>
          <span className="mt-1 block text-[0.6875rem] leading-4 opacity-80">
            {ratingDescriptions[rating]}
          </span>
        </button>
      ))}
    </div>
  );
}

function BlindImageView({
  card,
  revealed,
  answer,
  onToggleMask,
}: {
  card: Extract<Flashcard, { type: "blind" }>;
  revealed: Set<string>;
  answer: boolean;
  onToggleMask: (id: string) => void;
}) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-border bg-gray-100">
      <img src={card.imageUrl} alt={card.title} className="block w-full" />
      {!answer &&
        card.masks.map((mask) => {
          const isRevealed = revealed.has(mask.id);
          const isStroke = isStrokeMask(mask);

          return (
            <button
              key={mask.id}
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onToggleMask(mask.id);
              }}
              className={cn(
                "absolute",
                isRevealed && "border border-transparent bg-transparent",
                !isRevealed &&
                  !isStroke &&
                  "border border-white/60 bg-slate-950",
                !isRevealed && isStroke && "text-slate-950",
              )}
              style={{
                left: `${mask.x * 100}%`,
                top: `${mask.y * 100}%`,
                width: `${mask.width * 100}%`,
                height: `${mask.height * 100}%`,
              }}
              aria-label={isRevealed ? "가림막 다시 가리기" : "가림막 열기"}
            >
              {!isRevealed && isStroke && <StrokeMaskShape mask={mask} />}
            </button>
          );
        })}
    </div>
  );
}

function SpacedRepetitionGuide({ remainingCount }: { remainingCount: number }) {
  return (
    <section className="rounded-2xl border border-primary-900 bg-primary-980/70 p-4">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-brand shadow-sm">
          <Brain aria-hidden="true" className="h-5 w-5" strokeWidth={1.7} />
        </span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-black text-foreground">
              에빙하우스 망각곡선 기반 복습
            </h2>
            <span className="rounded-full bg-white px-2 py-0.5 text-xs font-bold text-brand">
              남은 카드 {remainingCount}장
            </span>
          </div>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            기억이 빠르게 흐려지는 시점에 맞춰 다음 복습 시간을 자동으로
            계산해요. 피드백이 어려울수록 더 빨리, 쉬울수록 더 긴 간격으로 다시
            노출됩니다.
          </p>
          <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
            <div>
              <dt className="font-black text-rose-600">Again</dt>
              <dd className="text-muted-foreground">즉시 재학습</dd>
            </div>
            <div>
              <dt className="font-black text-amber-700">Hard</dt>
              <dd className="text-muted-foreground">짧은 간격 복습</dd>
            </div>
            <div>
              <dt className="font-black text-emerald-700">Good</dt>
              <dd className="text-muted-foreground">표준 간격 복습</dd>
            </div>
            <div>
              <dt className="font-black text-blue-700">Easy</dt>
              <dd className="text-muted-foreground">긴 간격 복습</dd>
            </div>
          </dl>
        </div>
      </div>
    </section>
  );
}

function StudyCard({
  card,
  flipped,
  onFlip,
}: {
  card: Flashcard;
  flipped: boolean;
  onFlip: () => void;
}) {
  const [differenceOpen, setDifferenceOpen] = useState(false);
  const [revealedMasks, setRevealedMasks] = useState<Set<string>>(new Set());

  useEffect(() => {
    setDifferenceOpen(false);
    setRevealedMasks(new Set());
  }, [card.id, flipped]);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onFlip}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onFlip();
        }
      }}
      className="min-h-[21rem] w-full rounded-2xl border border-border bg-card p-5 text-left shadow-[0_12px_32px_-22px_rgba(0,0,0,0.35)] transition active:scale-[0.99]"
      aria-label={flipped ? "앞면 보기" : "뒷면 보기"}
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <span className="rounded-full bg-primary-980 px-3 py-1 text-xs font-bold text-brand">
          {cardTypeLabels[card.type]}
        </span>
        <span className="text-xs font-medium text-muted-foreground">
          {flipped ? "정답" : "탭해서 뒤집기"}
        </span>
      </div>

      {card.type === "concept" && (
        <div className="flex min-h-[15rem] flex-col justify-center">
          <p className="text-sm font-semibold text-brand">
            {flipped ? "정의" : "용어"}
          </p>
          <p className="mt-3 text-2xl font-bold leading-9 text-foreground">
            {flipped ? card.definition : card.term}
          </p>
        </div>
      )}

      {card.type === "relation" && (
        <div className="flex min-h-[15rem] flex-col justify-center">
          <p className="text-sm font-semibold text-brand">
            {flipped ? "효과와 기전" : "원인/자극"}
          </p>
          <p className="mt-3 overflow-x-auto whitespace-nowrap text-2xl font-bold leading-9 text-foreground">
            {flipped ? `${card.trigger} → ${card.effect}` : card.trigger}
          </p>
          {flipped && (
            <p className="mt-4 rounded-xl bg-primary-980 p-4 text-sm leading-6 text-muted-foreground">
              {card.mechanism}
            </p>
          )}
        </div>
      )}

      {card.type === "compare" && (
        <div className="flex min-h-[15rem] flex-col justify-center">
          <p className="text-sm font-semibold text-brand">
            {flipped ? "공통점과 차이점" : "비교"}
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-primary-980 p-4 text-center text-lg font-bold text-foreground">
              {card.nameA}
            </div>
            <div className="rounded-xl bg-primary-980 p-4 text-center text-lg font-bold text-foreground">
              {card.nameB}
            </div>
          </div>
          {flipped && (
            <div className="mt-4 space-y-3">
              <p className="rounded-xl border border-border p-4 text-sm leading-6 text-foreground">
                {card.common}
              </p>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  setDifferenceOpen((prev) => !prev);
                }}
                className="w-full rounded-xl bg-slate-950 p-4 text-left text-sm font-semibold leading-6 text-white"
              >
                {differenceOpen ? card.difference : "차이점 탭해서 공개"}
              </button>
            </div>
          )}
        </div>
      )}

      {card.type === "blind" && (
        <div className="space-y-4">
          <p className="text-sm font-semibold text-brand">
            {flipped ? "정답 공개" : card.title}
          </p>
          <BlindImageView
            card={card}
            answer={flipped}
            revealed={revealedMasks}
            onToggleMask={(id) =>
              setRevealedMasks((prev) => {
                const next = new Set(prev);
                if (next.has(id)) next.delete(id);
                else next.add(id);
                return next;
              })
            }
          />
        </div>
      )}
    </div>
  );
}

function StudyPanel({
  cards,
  onRate,
  againModeIds,
  onExitAgainMode,
}: {
  cards: Flashcard[];
  onRate: (card: Flashcard, rating: Rating) => Promise<void> | void;
  againModeIds: string[] | null;
  onExitAgainMode: () => void;
}) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [ratingPending, setRatingPending] = useState(false);
  const now = Date.now();

  const queue = useMemo(() => {
    if (againModeIds) {
      const ids = new Set(againModeIds);
      return cards.filter((card) => ids.has(card.id));
    }

    return cards.filter((card) => isDue(card, now));
  }, [againModeIds, cards, now]);

  useEffect(() => {
    setIndex(0);
    setFlipped(false);
  }, [againModeIds?.join("|"), queue.length]);

  const current = queue[index] ?? queue[0];

  const handleRate = async (rating: Rating) => {
    if (!current || ratingPending) return;

    setRatingPending(true);
    try {
      await onRate(current, rating);
      setFlipped(false);
      setIndex((prev) =>
        queue.length <= 1 ? 0 : Math.min(prev, queue.length - 2),
      );
    } finally {
      setRatingPending(false);
    }
  };

  if (!current) {
    return (
      <div className="rounded-2xl border border-dashed border-border px-5 py-16 text-center">
        <BookOpen
          aria-hidden="true"
          className="mx-auto h-10 w-10 text-muted-foreground"
          strokeWidth={1.5}
        />
        <p className="mt-4 text-lg font-bold text-foreground">
          {againModeIds
            ? "Again 카드를 모두 복습했어요!"
            : "새 카드를 만들어보세요!"}
        </p>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          직접 만들기나 블라인드 탭에서 새 학습 카드를 추가할 수 있어요.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <SpacedRepetitionGuide remainingCount={queue.length} />

      {againModeIds && (
        <div className="flex items-center justify-between gap-3 rounded-xl bg-rose-50 px-4 py-3 text-rose-700">
          <p className="text-sm font-bold">
            Again 카드 {queue.length}장 재학습 중
          </p>
          <button
            type="button"
            onClick={onExitAgainMode}
            className="rounded-full bg-white px-3 py-1 text-xs font-bold"
          >
            해제
          </button>
        </div>
      )}

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span className="flex items-center gap-1">
          <Info aria-hidden="true" className="h-4 w-4" strokeWidth={1.7} />
          남은 카드 {queue.length}장
        </span>
        <span>{formatDueTime(current)}</span>
      </div>

      <StudyCard
        card={current}
        flipped={flipped}
        onFlip={() => setFlipped((prev) => !prev)}
      />

      <RatingBar disabled={!flipped || ratingPending} onRate={handleRate} />
    </div>
  );
}

function WeakPanel({
  cards,
  logs,
  weakFolders,
  onRate,
  onDelete,
}: {
  cards: Flashcard[];
  logs: ReviewLog[];
  weakFolders: WeakFolders;
  onRate: (card: Flashcard, rating: Rating) => Promise<void> | void;
  onDelete: (cardId: string) => Promise<void> | void;
}) {
  const [folder, setFolder] = useState<Rating | null>(null);
  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  const [flipped, setFlipped] = useState(false);
  const [ratingPending, setRatingPending] = useState(false);

  const folders = useMemo(() => {
    const result: Record<Rating, Flashcard[]> = {
      again: [],
      hard: [],
      good: [],
      easy: [],
    };

    cards.forEach((card) => {
      const latestRating = card.lastRating ?? getLatestRating(card.id, logs);
      if (latestRating) result[latestRating].push(card);
    });

    weakFolderOrder.forEach((rating) => {
      if (weakFolders[rating].length > 0) {
        result[rating] = weakFolders[rating];
      }
    });

    return result;
  }, [cards, logs, weakFolders]);

  const folderCards = folder ? folders[folder] : [];
  const activeCard =
    folderCards.find((card) => card.id === activeCardId) ?? folderCards[0];

  useEffect(() => {
    setActiveCardId(null);
    setFlipped(false);
  }, [folder]);

  if (!folder) {
    return (
      <div className="space-y-4">
        <section className="rounded-2xl border border-border bg-card p-4">
          <h2 className="text-lg font-black text-foreground">내 카드 분류함</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            학습 피드백에 따라 카드가 자동으로 분류돼요. 폴더를 누르면 바로 다시
            학습할 수 있어요.
          </p>
        </section>

        <div className="grid grid-cols-2 gap-3">
          {weakFolderOrder.map((rating) => (
            <button
              key={rating}
              type="button"
              onClick={() => setFolder(rating)}
              className={cn(
                "min-h-[8.25rem] rounded-2xl border p-4 text-left transition active:scale-[0.98]",
                ratingToneClass[rating],
              )}
            >
              <span className="text-base font-black">
                {ratingLabels[rating]}
              </span>
              <span className="mt-4 block text-4xl font-black leading-none">
                {folders[rating].length}
              </span>
              <span className="mt-3 block text-xs leading-5 opacity-75">
                {weakFolderDescriptions[rating]}
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={() => setFolder(null)}
        className="flex items-center gap-1 text-sm font-bold text-muted-foreground"
      >
        <ChevronLeft aria-hidden="true" className="h-4 w-4" />
        폴더로 돌아가기
      </button>

      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-foreground">
          {ratingLabels[folder]} 카드
        </h3>
        <span className="text-sm text-muted-foreground">
          {folderCards.length}장
        </span>
      </div>

      {folderCards.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border px-5 py-14 text-center text-sm leading-6 text-muted-foreground">
          이 폴더에 카드가 없어요.
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {folderCards.map((card) => (
              <div
                key={card.id}
                className={cn(
                  "flex items-center gap-3 rounded-xl border border-border p-3",
                  activeCard?.id === card.id && "border-primary bg-primary-980",
                )}
              >
                <button
                  type="button"
                  onClick={() => {
                    setActiveCardId(card.id);
                    setFlipped(false);
                  }}
                  className="min-w-0 flex-1 text-left"
                >
                  <p className="truncate text-sm font-bold text-foreground">
                    {getCardTitle(card)}
                  </p>
                  <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                    {getCardSubtitle(card)}
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(card.id)}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-muted-foreground"
                  aria-label="카드 삭제"
                >
                  <Trash2 aria-hidden="true" className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          {activeCard && (
            <div className="space-y-4">
              <StudyCard
                card={activeCard}
                flipped={flipped}
                onFlip={() => setFlipped((prev) => !prev)}
              />
              <RatingBar
                disabled={!flipped || ratingPending}
                onRate={async (rating) => {
                  if (ratingPending) return;

                  setRatingPending(true);
                  try {
                    await onRate(activeCard, rating);
                    setFlipped(false);
                  } finally {
                    setRatingPending(false);
                  }
                }}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}

function ManualCreateForm({
  onAdd,
}: {
  onAdd: (draft: FlashcardDraft) => Promise<void> | void;
}) {
  const [type, setType] = useState<CardType>("concept");
  const [concept, setConcept] = useState(emptyConcept);
  const [relation, setRelation] = useState(emptyRelation);
  const [compare, setCompare] = useState(emptyCompare);

  const handleSubmit = async () => {
    if (type === "concept") {
      const term = concept.term.trim();
      const definition = concept.definition.trim();
      if (!term || !definition) return;
      await onAdd({ type, term, definition });
      setConcept(emptyConcept);
    }

    if (type === "relation") {
      const trigger = relation.trigger.trim();
      const effect = relation.effect.trim();
      const mechanism = relation.mechanism.trim();
      if (!trigger || !effect || !mechanism) return;
      await onAdd({ type, trigger, effect, mechanism });
      setRelation(emptyRelation);
    }

    if (type === "compare") {
      const nameA = compare.nameA.trim();
      const nameB = compare.nameB.trim();
      const common = compare.common.trim();
      const difference = compare.difference.trim();
      if (!nameA || !nameB || !common || !difference) return;
      await onAdd({ type, nameA, nameB, common, difference });
      setCompare(emptyCompare);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2 rounded-xl bg-gray-100 p-1">
        {(["concept", "relation", "compare"] as CardType[]).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setType(item)}
            className={cn(
              "h-10 rounded-lg text-sm font-bold text-muted-foreground",
              type === item && "bg-white text-foreground shadow-sm",
            )}
          >
            {cardTypeLabels[item]}
          </button>
        ))}
      </div>

      {type === "concept" && (
        <div className="space-y-3">
          <Input
            value={concept.term}
            onChange={(event) =>
              setConcept((prev) => ({ ...prev, term: event.target.value }))
            }
            placeholder="용어"
          />
          <Textarea
            value={concept.definition}
            onChange={(event) =>
              setConcept((prev) => ({
                ...prev,
                definition: event.target.value,
              }))
            }
            placeholder="정의"
          />
        </div>
      )}

      {type === "relation" && (
        <div className="space-y-4">
          <div className="rounded-2xl bg-primary-980 px-4 py-3 text-sm leading-6 text-muted-foreground">
            기전(MOA), 인과관계, A → B → C 흐름을 빈칸 채우기형 문맥 카드로
            저장해요.
          </div>

          <div>
            <div className="mb-2 grid grid-cols-[1fr_1.5rem_1fr] items-center gap-2 text-sm font-black text-foreground">
              <span>원인 / 이전 단계</span>
              <span className="text-center text-brand">→</span>
              <span>결과 / 다음 단계</span>
            </div>
            <div className="grid grid-cols-[minmax(0,1fr)_1.5rem_minmax(0,1fr)] items-center gap-2">
              <Input
                value={relation.trigger}
                onChange={(event) =>
                  setRelation((prev) => ({
                    ...prev,
                    trigger: event.target.value,
                  }))
                }
                placeholder="예: ACE 억제제"
                className="min-w-0"
              />
              <span className="text-center text-lg font-black text-brand">
                →
              </span>
              <Input
                value={relation.effect}
                onChange={(event) =>
                  setRelation((prev) => ({
                    ...prev,
                    effect: event.target.value,
                  }))
                }
                placeholder="예: 브래디키닌 축적"
                className="min-w-0"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-black text-foreground">
              관계 메커니즘
            </label>
            <Textarea
              value={relation.mechanism}
              onChange={(event) =>
                setRelation((prev) => ({
                  ...prev,
                  mechanism: event.target.value,
                }))
              }
              placeholder="예: ACE 효소가 차단되어 브래디키닌 분해 감소 → 기도 자극"
            />
          </div>
        </div>
      )}

      {type === "compare" && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <Input
              value={compare.nameA}
              onChange={(event) =>
                setCompare((prev) => ({ ...prev, nameA: event.target.value }))
              }
              placeholder="A"
            />
            <Input
              value={compare.nameB}
              onChange={(event) =>
                setCompare((prev) => ({ ...prev, nameB: event.target.value }))
              }
              placeholder="B"
            />
          </div>
          <Textarea
            value={compare.common}
            onChange={(event) =>
              setCompare((prev) => ({ ...prev, common: event.target.value }))
            }
            placeholder="공통점"
          />
          <Textarea
            value={compare.difference}
            onChange={(event) =>
              setCompare((prev) => ({
                ...prev,
                difference: event.target.value,
              }))
            }
            placeholder="차이점"
          />
        </div>
      )}

      <Button type="button" onClick={handleSubmit} className="w-full">
        카드 추가
      </Button>
    </div>
  );
}

function CreatePanel({
  cards,
  onAddMany,
  onDelete,
}: {
  cards: Flashcard[];
  onAddMany: (drafts: FlashcardDraft[]) => Promise<void> | void;
  onDelete: (cardId: string) => Promise<void> | void;
}) {
  const [mode, setMode] = useState<CreateMode>("ai");
  const [topic, setTopic] = useState("");
  const [sourceText, setSourceText] = useState("");
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  const handleGenerate = async () => {
    const trimmed = topic.trim();
    const trimmedText = sourceText.trim();
    if (!trimmed && !trimmedText && !sourceFile) return;

    setGenerating(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("topic", trimmed);
      formData.append("text", trimmedText);
      if (sourceFile) formData.append("file", sourceFile);

      const token = await getValidAccessToken();
      const headers: Record<string, string> = {};
      if (token) headers.Authorization = `Bearer ${token}`;

      const response = await fetch("/api/flashcards/generate", {
        method: "POST",
        headers,
        body: formData,
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          message?: string;
        } | null;
        throw new Error(payload?.message || "카드를 생성하지 못했어요.");
      }

      const payload = (await response.json()) as { cards?: FlashcardDraft[] };
      const drafts = Array.isArray(payload.cards) ? payload.cards : [];

      if (drafts.length === 0) {
        throw new Error("생성된 카드가 없어요.");
      }

      await onAddMany(drafts);
      setTopic("");
      setSourceText("");
      setSourceFile(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "카드를 생성하지 못했어요.",
      );
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-2 rounded-xl bg-gray-100 p-1">
        {[
          { key: "ai", label: "AI 자동 생성" },
          { key: "manual", label: "직접 만들기" },
        ].map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setMode(item.key as CreateMode)}
            className={cn(
              "h-11 rounded-lg text-sm font-bold text-muted-foreground",
              mode === item.key && "bg-white text-foreground shadow-sm",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {mode === "ai" ? (
        <div className="space-y-4 rounded-2xl border border-border p-4">
          <div className="rounded-2xl border border-primary-900 bg-primary-980 p-4">
            <div className="flex items-start gap-3">
              <Sparkles
                aria-hidden="true"
                className="mt-0.5 h-5 w-5 shrink-0 text-brand"
                strokeWidth={1.8}
              />
              <div>
                <h3 className="text-base font-black text-foreground">
                  AI 자동 생성
                </h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  사진 필기, 교재 페이지, PDF, 또는 붙여넣은 텍스트에서 핵심을
                  뽑아 개념·관계·비교 카드 초안을 만듭니다.
                </p>
              </div>
            </div>
          </div>

          <Input
            value={topic}
            onChange={(event) => setTopic(event.target.value)}
            placeholder="주제 예: 베타 차단제, ACE 억제제, 항응고제 비교"
          />

          <label className="flex min-h-[8.75rem] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-primary-800 bg-primary-980/50 px-4 py-6 text-center transition active:scale-[0.99]">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-brand shadow-sm">
              <FileUp
                aria-hidden="true"
                className="h-6 w-6"
                strokeWidth={1.7}
              />
            </span>
            <span className="mt-3 text-base font-black text-foreground">
              {sourceFile ? sourceFile.name : "파일 업로드"}
            </span>
            <span className="mt-1 text-sm leading-5 text-muted-foreground">
              사진(PNG · JPG · WEBP), PDF, TXT · MD · CSV · 최대 8MB
            </span>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,application/pdf,text/plain,text/markdown,text/csv,.txt,.md,.csv"
              className="sr-only"
              onChange={(event) => {
                const file = event.target.files?.[0] ?? null;
                if (file && file.size > 8 * 1024 * 1024) {
                  setError("8MB 이하의 파일만 업로드할 수 있어요.");
                  event.target.value = "";
                  return;
                }

                setSourceFile(file);
                setError("");
                event.target.value = "";
              }}
            />
          </label>

          {sourceFile && (
            <button
              type="button"
              onClick={() => setSourceFile(null)}
              className="flex w-full items-center justify-between rounded-xl bg-gray-100 px-4 py-3 text-left text-sm font-bold text-muted-foreground"
            >
              <span className="truncate">{sourceFile.name}</span>
              <X aria-hidden="true" className="h-4 w-4 shrink-0" />
            </button>
          )}

          <div className="flex items-center gap-3 text-sm font-bold text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            또는 직접 붙여넣기
            <span className="h-px flex-1 bg-border" />
          </div>

          <div>
            <label className="mb-2 block text-sm font-black text-foreground">
              학습 자료 텍스트
            </label>
            <Textarea
              value={sourceText}
              onChange={(event) => setSourceText(event.target.value)}
              placeholder="예: 베타 차단제는 β1, β2 아드레날린 수용체를 차단한다..."
              className="min-h-[9rem]"
            />
          </div>

          {error && (
            <p className="text-sm font-medium text-rose-600">{error}</p>
          )}
          <Button
            type="button"
            onClick={handleGenerate}
            disabled={
              generating || (!topic.trim() && !sourceText.trim() && !sourceFile)
            }
            className="w-full"
          >
            {generating && <Loader2 className="animate-spin" />}
            AI 카드 초안 생성
          </Button>
        </div>
      ) : (
        <ManualCreateForm onAdd={(draft) => onAddMany([draft])} />
      )}

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-foreground">전체 카드</h3>
          <span className="text-sm text-muted-foreground">
            최근 {Math.min(cards.length, 20)} / {cards.length}장
          </span>
        </div>

        {cards.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border px-5 py-10 text-center text-sm text-muted-foreground">
            아직 저장된 카드가 없어요.
          </div>
        ) : (
          <div className="space-y-2">
            {cards
              .slice()
              .sort((left, right) => right.createdAt - left.createdAt)
              .slice(0, 20)
              .map((card) => (
                <div
                  key={card.id}
                  className="flex items-center gap-3 rounded-xl border border-border p-3"
                >
                  <span className="shrink-0 rounded-full bg-primary-980 px-2.5 py-1 text-xs font-bold text-brand">
                    {cardTypeLabels[card.type]}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-foreground">
                      {getCardTitle(card)}
                    </p>
                    <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                      {getCardSubtitle(card)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onDelete(card.id)}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-muted-foreground"
                    aria-label="카드 삭제"
                  >
                    <Trash2 aria-hidden="true" className="h-4 w-4" />
                  </button>
                </div>
              ))}
          </div>
        )}
      </section>
    </div>
  );
}

function BlindEditor({
  onSave,
}: {
  onSave: (draft: FlashcardDraft) => Promise<void> | void;
}) {
  const stageRef = useRef<HTMLDivElement>(null);
  const draftStartRef = useRef<{ x: number; y: number } | null>(null);
  const lastStrokePointRef = useRef<{ x: number; y: number } | null>(null);
  const activeStrokeIdRef = useRef<string | null>(null);
  const [title, setTitle] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [masks, setMasks] = useState<BlindMask[]>([]);
  const [revealed, setRevealed] = useState<Set<string>>(new Set());
  const [mode, setMode] = useState<"edit" | "study">("edit");
  const [tool, setTool] = useState<BlindTool>("box");
  const [draftMask, setDraftMask] = useState<BlindMask | null>(null);
  const [isFreehandDrawing, setIsFreehandDrawing] = useState(false);
  const [movingMask, setMovingMask] = useState<{
    id: string;
    offsetX: number;
    offsetY: number;
  } | null>(null);
  const [resizingMaskId, setResizingMaskId] = useState<string | null>(null);
  const [toast, setToast] = useState("");
  const [saving, setSaving] = useState(false);

  const getPoint = (event: PointerEvent<HTMLDivElement>) => {
    const rect = stageRef.current?.getBoundingClientRect();
    if (!rect) return null;

    return {
      x: Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width)),
      y: Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height)),
    };
  };

  const startStrokeMask = (point: { x: number; y: number }) => {
    const id = createMaskId();
    activeStrokeIdRef.current = id;
    lastStrokePointRef.current = point;
    setMasks((prev) => [...prev, buildStrokeMask(id, [point])]);
  };

  const appendStrokePoint = (point: { x: number; y: number }) => {
    const activeStrokeId = activeStrokeIdRef.current;
    if (!activeStrokeId) return;

    const lastPoint = lastStrokePointRef.current;
    if (
      lastPoint &&
      getDistance(lastPoint, point) < MIN_STROKE_POINT_DISTANCE
    ) {
      return;
    }

    lastStrokePointRef.current = point;
    setMasks((prev) =>
      prev.map((mask) => {
        if (mask.id !== activeStrokeId) return mask;

        return buildStrokeMask(mask.id, [...(mask.points ?? []), point]);
      }),
    );
  };

  const eraseMaskAt = (point: { x: number; y: number }) => {
    setMasks((prev) =>
      prev.filter((mask) => {
        const padding = 0.018;
        const insideX =
          point.x >= mask.x - padding &&
          point.x <= mask.x + mask.width + padding;
        const insideY =
          point.y >= mask.y - padding &&
          point.y <= mask.y + mask.height + padding;

        return !(insideX && insideY);
      }),
    );
  };

  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type === "application/pdf") {
      setToast(
        "PDF 첫 페이지 렌더링은 아직 지원하지 않아요. JPG 또는 PNG를 올려주세요.",
      );
      event.target.value = "";
      return;
    }

    if (!file.type.startsWith("image/")) {
      setToast("JPG 또는 PNG 이미지를 올려주세요.");
      event.target.value = "";
      return;
    }

    const dataUrl = await readFileAsDataUrl(file);
    setImageUrl(dataUrl);
    setMasks([]);
    setRevealed(new Set());
    setDraftMask(null);
    activeStrokeIdRef.current = null;
    lastStrokePointRef.current = null;
    draftStartRef.current = null;
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (mode !== "edit" || !imageUrl || movingMask || resizingMaskId) return;
    const point = getPoint(event);
    if (!point) return;

    event.currentTarget.setPointerCapture(event.pointerId);

    if (tool === "pen") {
      setIsFreehandDrawing(true);
      startStrokeMask(point);
      return;
    }

    if (tool === "eraser") {
      setIsFreehandDrawing(true);
      eraseMaskAt(point);
      return;
    }

    setDraftMask({
      id: "draft",
      x: point.x,
      y: point.y,
      width: 0,
      height: 0,
    });
    draftStartRef.current = point;
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const point = getPoint(event);
    if (!point) return;

    if (isFreehandDrawing && tool === "pen") {
      appendStrokePoint(point);
      return;
    }

    if (isFreehandDrawing && tool === "eraser") {
      eraseMaskAt(point);
      return;
    }

    if (movingMask) {
      setMasks((prev) =>
        prev.map((mask) => {
          if (mask.id !== movingMask.id) return mask;
          const nextX = Math.min(
            1 - mask.width,
            Math.max(0, point.x - movingMask.offsetX),
          );
          const nextY = Math.min(
            1 - mask.height,
            Math.max(0, point.y - movingMask.offsetY),
          );
          const deltaX = nextX - mask.x;
          const deltaY = nextY - mask.y;

          return {
            ...mask,
            x: nextX,
            y: nextY,
            points: mask.points?.map((strokePoint) => ({
              x: strokePoint.x + deltaX,
              y: strokePoint.y + deltaY,
            })),
          };
        }),
      );
      return;
    }

    if (resizingMaskId) {
      setMasks((prev) =>
        prev.map((mask) => {
          if (mask.id !== resizingMaskId) return mask;

          return {
            ...mask,
            width: Math.min(1 - mask.x, Math.max(0.03, point.x - mask.x)),
            height: Math.min(1 - mask.y, Math.max(0.03, point.y - mask.y)),
          };
        }),
      );
      return;
    }

    if (!draftMask) {
      draftStartRef.current = null;
      return;
    }
    const startPoint = draftStartRef.current;
    if (!startPoint) return;

    setDraftMask((prev) => {
      if (!prev) return null;

      const left = Math.min(startPoint.x, point.x);
      const top = Math.min(startPoint.y, point.y);
      const width = Math.abs(point.x - startPoint.x);
      const height = Math.abs(point.y - startPoint.y);

      return {
        ...prev,
        x: left,
        y: top,
        width,
        height,
      };
    });
  };

  const handlePointerUp = () => {
    if (isFreehandDrawing) {
      setIsFreehandDrawing(false);
      activeStrokeIdRef.current = null;
      lastStrokePointRef.current = null;
      return;
    }

    if (movingMask || resizingMaskId) {
      setMovingMask(null);
      setResizingMaskId(null);
      return;
    }

    if (!draftMask) return;

    if (draftMask.width > 0.02 && draftMask.height > 0.02) {
      setMasks((prev) => [...prev, { ...draftMask, id: createMaskId() }]);
    }

    setDraftMask(null);
    draftStartRef.current = null;
  };

  const handleSave = async () => {
    const trimmed = title.trim();
    if (!trimmed || !imageUrl || masks.length === 0 || saving) return;

    setSaving(true);
    try {
      const compressed = await downscaleImage(imageUrl);
      await onSave({
        type: "blind",
        title: trimmed,
        imageUrl: compressed,
        masks,
      });
      setTitle("");
      setImageUrl("");
      setMasks([]);
      setRevealed(new Set());
      setMode("edit");
      setTool("box");
      activeStrokeIdRef.current = null;
      lastStrokePointRef.current = null;
      draftStartRef.current = null;
    } catch (error) {
      setToast(
        error instanceof Error
          ? error.message
          : "블라인드 카드를 저장하지 못했어요.",
      );
    } finally {
      setSaving(false);
    }
  };

  const visibleMasks = draftMask ? [...masks, draftMask] : masks;

  const beginMoveMask = (
    event: PointerEvent<HTMLDivElement>,
    mask: BlindMask,
  ) => {
    if (mode !== "edit" || tool !== "box") return;
    const point = getPoint(event);
    if (!point) return;

    event.stopPropagation();
    stageRef.current?.setPointerCapture(event.pointerId);
    setMovingMask({
      id: mask.id,
      offsetX: point.x - mask.x,
      offsetY: point.y - mask.y,
    });
  };

  const beginResizeMask = (
    event: PointerEvent<HTMLSpanElement>,
    maskId: string,
  ) => {
    if (mode !== "edit") return;

    event.stopPropagation();
    stageRef.current?.setPointerCapture(event.pointerId);
    setResizingMaskId(maskId);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border p-4">
        <Input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="카드 제목"
        />
        <label className="mt-3 flex h-14 cursor-pointer items-center justify-center rounded-xl border border-dashed border-border text-sm font-bold text-muted-foreground">
          JPG/PNG 업로드
          <input
            type="file"
            accept="image/png,image/jpeg,application/pdf"
            className="sr-only"
            onChange={handleFile}
          />
        </label>
      </div>

      <div className="grid grid-cols-2 gap-2 rounded-xl bg-gray-100 p-1">
        {[
          { key: "edit", label: "편집" },
          { key: "study", label: "학습" },
        ].map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setMode(item.key as "edit" | "study")}
            className={cn(
              "h-10 rounded-lg text-sm font-bold text-muted-foreground",
              mode === item.key && "bg-white text-foreground shadow-sm",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {imageUrl ? (
        <div
          ref={stageRef}
          className="relative touch-none overflow-hidden rounded-2xl border border-border bg-gray-100"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={() => {
            setDraftMask(null);
            draftStartRef.current = null;
            setMovingMask(null);
            setResizingMaskId(null);
            setIsFreehandDrawing(false);
            activeStrokeIdRef.current = null;
            lastStrokePointRef.current = null;
          }}
        >
          <img
            src={imageUrl}
            alt="블라인드 편집 이미지"
            className="block w-full"
          />
          {visibleMasks.map((mask) => {
            const hidden = mode === "study" && revealed.has(mask.id);
            const isStroke = isStrokeMask(mask);

            return (
              <div
                key={mask.id}
                role="button"
                tabIndex={mode === "study" ? 0 : -1}
                onPointerDown={(event) => {
                  if (mask.id !== "draft") beginMoveMask(event, mask);
                }}
                onClick={(event) => {
                  if (mode !== "study") return;
                  event.stopPropagation();
                  setRevealed((prev) => {
                    const next = new Set(prev);
                    if (next.has(mask.id)) next.delete(mask.id);
                    else next.add(mask.id);
                    return next;
                  });
                }}
                onKeyDown={(event) => {
                  if (mode !== "study") return;
                  if (event.key !== "Enter" && event.key !== " ") return;

                  event.preventDefault();
                  setRevealed((prev) => {
                    const next = new Set(prev);
                    if (next.has(mask.id)) next.delete(mask.id);
                    else next.add(mask.id);
                    return next;
                  });
                }}
                className={cn(
                  "absolute",
                  hidden && "border border-transparent bg-transparent",
                  !hidden && !isStroke && "border border-white/60 bg-slate-950",
                  !hidden && isStroke && "text-slate-950",
                  mode === "edit" && mask.id !== "draft" && "cursor-move",
                )}
                style={{
                  left: `${mask.x * 100}%`,
                  top: `${mask.y * 100}%`,
                  width: `${mask.width * 100}%`,
                  height: `${mask.height * 100}%`,
                }}
                aria-label={hidden ? "가림막 다시 가리기" : "가림막"}
              >
                {!hidden && isStroke && <StrokeMaskShape mask={mask} />}
                {mode === "edit" && mask.id !== "draft" && !isStroke && (
                  <span
                    className="absolute bottom-0 right-0 h-4 w-4 translate-x-1/2 translate-y-1/2 cursor-nwse-resize rounded-full border border-white bg-primary"
                    onPointerDown={(event) => beginResizeMask(event, mask.id)}
                    aria-hidden="true"
                  />
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-border px-5 py-16 text-center">
          <EyeOff
            aria-hidden="true"
            className="mx-auto h-10 w-10 text-muted-foreground"
            strokeWidth={1.5}
          />
          <p className="mt-4 text-sm leading-6 text-muted-foreground">
            구조식, 표, 회로 이미지 위에 드래그로 가림막을 만들 수 있어요.
          </p>
        </div>
      )}

      {mode === "edit" ? (
        <div className="rounded-2xl bg-gray-100 p-1">
          <div className="grid grid-cols-3 gap-1">
            {[
              { key: "box", label: "가림 상자", icon: Square },
              { key: "pen", label: "펜", icon: PenLine },
              { key: "eraser", label: "지우개", icon: Eraser },
            ].map((item) => {
              const Icon = item.icon;
              const active = tool === item.key;

              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setTool(item.key as BlindTool)}
                  className={cn(
                    "flex h-12 items-center justify-center gap-1.5 rounded-xl text-sm font-black text-muted-foreground",
                    active && "bg-white text-foreground shadow-sm",
                  )}
                >
                  <Icon
                    aria-hidden="true"
                    className="h-4 w-4"
                    strokeWidth={1.8}
                  />
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="rounded-2xl bg-primary-980 px-4 py-3 text-sm leading-6 text-muted-foreground">
          학습 모드에서는 가림막을 누르면 해당 영역만 열리고, 다시 누르면
          가려져요.
        </div>
      )}

      <Button
        type="button"
        onClick={handleSave}
        disabled={!title.trim() || !imageUrl || masks.length === 0 || saving}
        className="w-full"
      >
        {saving && <Loader2 className="animate-spin" />}
        카드로 저장
      </Button>

      <Toast open={!!toast} message={toast} onClose={() => setToast("")} />
    </div>
  );
}

function StatsPanel({
  cards,
  logs,
  stats,
  againTodayCards,
  onStartAgain,
}: {
  cards: Flashcard[];
  logs: ReviewLog[];
  stats: FlashcardStats | null;
  againTodayCards: Flashcard[];
  onStartAgain: (cardIds: string[]) => void;
}) {
  const againIds = useMemo(
    () => againTodayCards.map((card) => card.id),
    [againTodayCards],
  );
  const weakCount = useMemo(() => cards.filter(isWeakCard).length, [cards]);
  const typeCounts = useMemo(() => {
    if (stats) return stats.typeDistribution;

    return cards.reduce<Record<CardType, number>>(
      (acc, card) => {
        acc[card.type] += 1;
        return acc;
      },
      { concept: 0, relation: 0, compare: 0, blind: 0 },
    );
  }, [cards, stats]);
  const totalCards = stats?.totalCards ?? cards.length;
  const streak = stats?.streak ?? 0;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-border p-4">
          <p className="text-sm font-bold text-muted-foreground">총 카드</p>
          <p className="mt-3 text-3xl font-black text-foreground">
            {totalCards}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onStartAgain(againIds)}
          disabled={againIds.length === 0}
          className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-left text-rose-700 transition active:scale-[0.98] disabled:opacity-60"
        >
          <p className="text-sm font-bold">Again 카드</p>
          <p className="mt-3 text-3xl font-black">
            {stats?.againToday ?? againIds.length}
          </p>
        </button>
        <div className="rounded-2xl border border-border p-4">
          <p className="text-sm font-bold text-muted-foreground">연속 학습</p>
          <p className="mt-3 text-3xl font-black text-foreground">{streak}일</p>
        </div>
        <div className="rounded-2xl border border-border p-4">
          <p className="text-sm font-bold text-muted-foreground">취약 카드</p>
          <p className="mt-3 text-3xl font-black text-foreground">
            {weakCount}
          </p>
        </div>
      </div>

      <section className="rounded-2xl border border-border p-4">
        <h3 className="text-lg font-bold text-foreground">타입별 분포</h3>
        <div className="mt-4 space-y-3">
          {(Object.keys(typeCounts) as CardType[]).map((type) => {
            const value = typeCounts[type];
            const width = totalCards
              ? Math.max(6, (value / totalCards) * 100)
              : 0;

            return (
              <div key={type}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-bold text-foreground">
                    {cardTypeLabels[type]}
                  </span>
                  <span className="text-muted-foreground">{value}장</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${width}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl border border-border p-4">
        <h3 className="text-lg font-bold text-foreground">오늘 리뷰 로그</h3>
        <div className="mt-3 space-y-2">
          {logs.filter((log) => getTodayKey(log.at) === getTodayKey())
            .length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              오늘 기록된 평가가 없어요.
            </p>
          ) : (
            logs
              .filter((log) => getTodayKey(log.at) === getTodayKey())
              .slice(-8)
              .reverse()
              .map((log, index) => (
                <div
                  key={`${log.cardId}-${log.at}-${index}`}
                  className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2 text-sm"
                >
                  <span className="font-medium text-foreground">
                    {ratingLabels[log.rating]}
                  </span>
                  <span className="text-muted-foreground">
                    {log.intervalAfter === 0
                      ? "1분 후"
                      : `${log.intervalAfter}일 후`}
                  </span>
                </div>
              ))
          )}
        </div>
      </section>
    </div>
  );
}

function FlashcardPageNavigation({
  activeTab,
  onChange,
}: {
  activeTab: AppTab;
  onChange: (tab: AppTab) => void;
}) {
  return (
    <nav
      aria-label="플래시카드 전용 네비게이션"
      className="fixed bottom-0 left-1/2 z-50 grid h-[calc(5.25rem+env(safe-area-inset-bottom))] w-full max-w-app -translate-x-1/2 grid-cols-5 items-start border-t border-gray-300 bg-white pb-[env(safe-area-inset-bottom)]"
    >
      {tabItems.map((item) => {
        const Icon = item.icon;
        const active = activeTab === item.key;

        return (
          <button
            key={item.key}
            type="button"
            onClick={() => onChange(item.key)}
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative flex h-[70px] w-full min-w-0 flex-col items-center justify-center gap-0.5 text-[10px] font-semibold leading-[14px] text-muted-foreground transition-colors active:scale-95",
              active && "text-primary",
            )}
          >
            <Icon aria-hidden="true" className="h-5 w-5" strokeWidth={2} />
            <span className="truncate">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

export function FlashcardApp() {
  const {
    cards,
    logs,
    againTodayCards,
    weakFolders,
    stats,
    ready,
    toast,
    setToast,
    setCards,
    refresh,
  } = useFlashcardData();
  const [activeTab, setActiveTab] = useState<AppTab>("study");
  const [againModeIds, setAgainModeIds] = useState<string[] | null>(null);

  const activeTabConfig =
    tabItems.find((item) => item.key === activeTab) ?? tabItems[0];

  const addDrafts = async (drafts: FlashcardDraft[]) => {
    try {
      const createdCards = await Promise.all(drafts.map(createRemoteFlashcard));
      setCards(mergeFlashcards(createdCards, cards));
      setToast(`${createdCards.length}장의 카드를 저장했어요.`);
      void refresh();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "카드를 저장하지 못했어요.";
      setToast(message);
      throw new Error(message);
    }
  };

  const deleteCard = async (cardId: string) => {
    try {
      await deleteRemoteFlashcard(cardId);
      setCards(cards.filter((card) => card.id !== cardId));
      setAgainModeIds((prev) => prev?.filter((id) => id !== cardId) ?? null);
      setToast("카드를 삭제했어요.");
      void refresh();
    } catch (error) {
      setToast(
        error instanceof Error ? error.message : "카드를 삭제하지 못했어요.",
      );
    }
  };

  const handleRate = async (target: Flashcard, rating: Rating) => {
    try {
      const reviewed = await reviewRemoteFlashcard(target.id, rating);
      const nextCards = mergeFlashcards(
        cards.map((card) => (card.id === target.id ? reviewed : card)),
        [reviewed],
      );
      setCards(nextCards);

      if (againModeIds && rating !== "again") {
        setAgainModeIds(
          (prev) => prev?.filter((id) => id !== target.id) ?? null,
        );
      }

      void refresh();
    } catch (error) {
      setToast(
        error instanceof Error ? error.message : "평가를 저장하지 못했어요.",
      );
      throw error;
    }
  };

  useEffect(() => {
    if (againModeIds && againModeIds.length === 0) {
      setAgainModeIds(null);
    }
  }, [againModeIds]);

  if (!ready) {
    return (
      <AppShell bottomNav={false} bottomSpacing="nav">
        <div className="flex min-h-dvh items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-brand" />
        </div>
        <FlashcardPageNavigation
          activeTab={activeTab}
          onChange={setActiveTab}
        />
      </AppShell>
    );
  }

  return (
    <AppShell bottomNav={false} bottomSpacing="nav">
      <FlashcardShellHeader />

      <main className="px-6 pt-5">
        <section className="pb-5">
          <p className="text-sm font-bold text-brand">PillChat Flashcards</p>
          <h1 className="mt-2 text-[1.75rem] font-black leading-9 text-foreground">
            {activeTabConfig.title}
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {activeTabConfig.description}
          </p>
        </section>

        <Fragment>
          {activeTab === "study" && (
            <StudyPanel
              cards={cards}
              onRate={handleRate}
              againModeIds={againModeIds}
              onExitAgainMode={() => setAgainModeIds(null)}
            />
          )}

          {activeTab === "weak" && (
            <WeakPanel
              cards={cards}
              logs={logs}
              weakFolders={weakFolders}
              onRate={handleRate}
              onDelete={deleteCard}
            />
          )}

          {activeTab === "create" && (
            <CreatePanel
              cards={cards}
              onAddMany={addDrafts}
              onDelete={deleteCard}
            />
          )}

          {activeTab === "blind" && (
            <BlindEditor onSave={(draft) => addDrafts([draft])} />
          )}

          {activeTab === "stats" && (
            <StatsPanel
              cards={cards}
              logs={logs}
              stats={stats}
              againTodayCards={againTodayCards}
              onStartAgain={(cardIds) => {
                if (cardIds.length === 0) return;
                setAgainModeIds(cardIds);
                setActiveTab("study");
              }}
            />
          )}
        </Fragment>
      </main>

      <Toast open={!!toast} message={toast} onClose={() => setToast("")} />
      <FlashcardPageNavigation activeTab={activeTab} onChange={setActiveTab} />
    </AppShell>
  );
}
