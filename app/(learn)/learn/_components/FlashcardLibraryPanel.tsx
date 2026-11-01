"use client";

import { LoadingIndicator } from "@/components/atoms/LoadingIndicator";

import { PillLoader } from "@/components/atoms/PillLoader";

import Link from "next/link";
import {
  Check,
  List,
  Plus,
  RotateCcw,
  Shuffle,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import {
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type Ref,
} from "react";

import { type FlashcardCollectionMap } from "@/lib/flashcards/collections";
import { cn } from "@/lib/utils";
import type { Flashcard, Rating } from "@/types/flashcard";

import { FlashcardStack } from "./FlashcardStack";
import { Button } from "@/components/ui/button";
import type { FlashcardPack } from "@/lib/flashcards/api";
import { flashcardGroups, flashcardReviewDate } from "@/lib/flashcards/library";

export type FlashcardStudyActionIntent =
  | { type: "flip"; cardId: string }
  | { type: "rate"; cardId: string; rating: "again" | "good" }
  | {
      type: "swipe";
      cardId: string;
      direction: "left" | "right";
      flipped: boolean;
    };

export type FlashcardStudyAction =
  | Extract<FlashcardStudyActionIntent, { type: "flip" }>
  | (Extract<FlashcardStudyActionIntent, { type: "swipe" | "rate" }> & {
      nextCardId: string | null;
    });

export interface FlashcardStudyControls {
  flip: () => Promise<void>;
  rate: (rating: "again" | "good") => Promise<void>;
  swipe: (direction: "left" | "right") => Promise<void>;
}

function cardTitle(card: Flashcard) {
  if (card.type === "concept") return card.term;
  if (card.type === "relation") return card.trigger;
  if (card.type === "compare") return `${card.nameA} vs ${card.nameB}`;
  return card.title;
}

export function FlashcardLibraryPanel({
  cards,
  packs,
  collectionByCardId,
  selectedCollection,
  onSelectCollection,
  onDelete,
  onRate,
  onStudyAction,
  allowStudyAction,
  studyControlsRef,
}: {
  cards: Flashcard[];
  packs?: FlashcardPack[];
  collectionByCardId: FlashcardCollectionMap;
  selectedCollection: string | null;
  onSelectCollection: (name: string) => void;
  onDelete: (cardId: string) => Promise<void>;
  onRate: (card: Flashcard, rating: Rating) => Promise<void>;
  onStudyAction?: (action: FlashcardStudyAction) => void;
  allowStudyAction?: (action: FlashcardStudyActionIntent) => boolean;
  studyControlsRef?: Ref<FlashcardStudyControls>;
}) {
  const [busy, setBusy] = useState(false);
  const groups = useMemo(
    () => flashcardGroups(cards, collectionByCardId, packs),
    [cards, collectionByCardId, packs],
  );
  const selectedGroup =
    groups.find(
      (group) =>
        group.id === selectedCollection ||
        (!packs && group.name === selectedCollection),
    ) ?? groups[0];

  return (
    <div>
      <section aria-labelledby="flashcard-packs-heading">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <h1
              id="flashcard-packs-heading"
              className="text-xl font-bold tracking-tight text-foreground"
            >
              내 카드팩
            </h1>
            <p className="mt-1 text-xs text-muted-foreground">
              {groups.length
                ? `${groups.length}개 카드팩 · 총 ${cards.length}장`
                : "나만의 카드를 만들고, 한 장씩 익혀보세요"}
            </p>
          </div>
          <Link
            href="/flashcards/create"
            aria-disabled={busy}
            tabIndex={busy ? -1 : undefined}
            onClick={(event) => {
              if (busy) event.preventDefault();
            }}
            className={cn(
              "flex h-10 shrink-0 items-center gap-1 rounded-lg px-2 text-xs font-bold text-brand transition hover:text-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2",
              busy && "pointer-events-none opacity-50",
            )}
          >
            <Plus aria-hidden="true" className="h-4 w-4" />
            카드 만들기
          </Link>
        </div>

        {selectedGroup && (
          <div
            data-flashcard-tutorial="packs"
            className="-mx-4 flex snap-x scroll-px-4 gap-3 overflow-x-auto px-4 py-2 [scrollbar-width:none] sm:-mx-6 sm:scroll-px-6 sm:gap-4 sm:px-6 [&::-webkit-scrollbar]:hidden"
          >
            {groups.map((group) => {
              const selected = group.id === selectedGroup.id;
              return (
                <button
                  key={group.id}
                  type="button"
                  disabled={busy}
                  aria-pressed={selected}
                  onClick={() =>
                    onSelectCollection(packs ? group.id : group.name)
                  }
                  className={cn(
                    "w-40 shrink-0 snap-start rounded-2xl p-4 text-left text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-4 disabled:cursor-wait sm:w-44",
                    selected ? "bg-accent" : "bg-accent/50 hover:bg-accent",
                  )}
                >
                  <span
                    className={cn(
                      "block truncate text-sm text-brand",
                      selected ? "font-bold" : "font-medium",
                    )}
                    title={group.name}
                  >
                    {group.name}
                  </span>
                  <span className="mt-1 block text-xs text-muted-foreground">
                    카드 {group.cards.length}장
                  </span>
                  <span className="mt-2 block text-body-small text-muted-foreground">
                    최근 학습 {flashcardReviewDate(group.lastReviewed)}
                  </span>
                  <span className="mt-1 block text-body-small text-muted-foreground">
                    학습 진행 {group.reviewedCount}/{group.cards.length}장 ·{" "}
                    {group.progress}%
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {selectedGroup?.cards.length ? (
        <div className="pt-20 sm:pt-24">
          <PackViewer
            key={selectedGroup.id}
            name={selectedGroup.name}
            cards={selectedGroup.cards}
            onDelete={onDelete}
            onRate={onRate}
            onStudyAction={onStudyAction}
            allowStudyAction={allowStudyAction}
            studyControlsRef={studyControlsRef}
            onBusyChange={setBusy}
          />
        </div>
      ) : (
        <div className="px-5 py-12 text-center">
          <div
            aria-hidden="true"
            className="mx-auto mb-8 flex flex-col items-center gap-4"
          >
            <Sparkles className="h-10 w-10 text-brand" strokeWidth={1.5} />
            <span className="text-xs font-bold text-brand">나의 첫 카드</span>
          </div>
          <h2 className="text-xl font-bold text-foreground">
            {selectedGroup
              ? "카드팩에 카드를 추가해보세요"
              : "첫 카드팩을 만들어보세요"}
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            공부할 내용을 넣으면 AI가 카드로 정리해줘요.
            <br />
            직접 쓰거나 이미지로 만들 수도 있어요.
          </p>
          <Link
            href="/flashcards/create"
            className="mx-auto mt-6 flex min-h-12 max-w-64 items-center justify-center gap-2 rounded-xl bg-brand px-5 text-sm font-bold text-white"
          >
            <Plus aria-hidden="true" className="h-4 w-4" />
            {selectedGroup ? "카드 추가하기" : "첫 카드 만들기"}
          </Link>
        </div>
      )}
    </div>
  );
}

function PackViewer({
  name,
  cards,
  onDelete,
  onRate,
  onBusyChange,
  onStudyAction,
  allowStudyAction,
  studyControlsRef,
}: {
  name: string;
  cards: Flashcard[];
  onDelete: (cardId: string) => Promise<void>;
  onRate: (card: Flashcard, rating: Rating) => Promise<void>;
  onBusyChange: (busy: boolean) => void;
  onStudyAction?: (action: FlashcardStudyAction) => void;
  allowStudyAction?: (action: FlashcardStudyActionIntent) => boolean;
  studyControlsRef?: Ref<FlashcardStudyControls>;
}) {
  const [studyIds, setStudyIds] = useState(() => cards.map((card) => card.id));
  const [currentCardId, setCurrentCardId] = useState<string | null>(
    cards[0]?.id ?? null,
  );
  const [flipped, setFlipped] = useState(false);
  const [shuffledIds, setShuffledIds] = useState<string[] | null>(null);
  const [direction, setDirection] = useState<"next" | "previous">("next");
  const [ratings, setRatings] = useState<Record<string, boolean>>({});
  const [retrying, setRetrying] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [managing, setManaging] = useState(false);
  const [ratingPending, setRatingPending] = useState(false);
  const [ratingError, setRatingError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const mutationLock = useRef(false);
  const deckRef = useRef<HTMLDivElement>(null);
  const resultHeadingRef = useRef<HTMLHeadingElement>(null);
  const managementButtonRef = useRef<HTMLButtonElement>(null);
  const focusIntent = useRef<"card" | "result" | "manager" | null>(null);
  const busy = ratingPending || deletingId !== null;
  const cardsById = useMemo(
    () => new Map(cards.map((card) => [card.id, card])),
    [cards],
  );
  const studyCards = useMemo(() => {
    const sessionIds = new Set(studyIds);
    const order = shuffledIds ?? studyIds;
    return [...order, ...studyIds.filter((id) => !order.includes(id))]
      .filter((id) => sessionIds.has(id))
      .flatMap((id) => {
        const card = cardsById.get(id);
        return card ? [card] : [];
      });
  }, [cardsById, shuffledIds, studyIds]);
  const current =
    (currentCardId ? cardsById.get(currentCardId) : undefined) ?? studyCards[0];
  const index = studyCards.findIndex((card) => card.id === current?.id);
  const reviewedCards = studyCards.filter(
    (card) => typeof ratings[card.id] === "boolean",
  );
  const wrongCards = reviewedCards.filter((card) => !ratings[card.id]);
  const correctCount = reviewedCards.length - wrongCards.length;
  const accuracy = reviewedCards.length
    ? Math.round((correctCount / reviewedCards.length) * 100)
    : 0;

  useEffect(() => {
    setFlipped(false);
  }, [current?.id]);

  useEffect(() => {
    if (!focusIntent.current || busy) return;
    const cardControls = deckRef.current?.querySelectorAll<HTMLButtonElement>(
      '[aria-hidden="false"] button:not(:disabled)',
    );
    const target =
      focusIntent.current === "result"
        ? resultHeadingRef.current
        : focusIntent.current === "manager"
          ? managementButtonRef.current
          : cardControls?.item(cardControls.length - 1);
    if (!target) return;
    target.focus({ preventScroll: true });
    focusIntent.current = null;
  }, [current?.id, showSummary, managing, flipped, busy]);

  const shuffle = () => {
    if (mutationLock.current) return;
    const ids = studyCards.map((card) => card.id);
    for (let i = ids.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [ids[i], ids[j]] = [ids[j], ids[i]];
    }
    setDirection("next");
    setShuffledIds(ids);
    setCurrentCardId(ids[0] ?? null);
    setFlipped(false);
  };

  const flipCard = async () => {
    if (!current || mutationLock.current) return;
    const action: FlashcardStudyActionIntent = {
      type: "flip",
      cardId: current.id,
    };
    if (allowStudyAction?.(action) === false) return;
    setFlipped(!flipped);
    onStudyAction?.(action);
  };

  const swipeCard = async (side: "left" | "right") => {
    if (!current || index < 0 || mutationLock.current) return;
    const action: FlashcardStudyActionIntent = {
      type: "swipe",
      cardId: current.id,
      direction: side,
      flipped,
    };
    if (allowStudyAction?.(action) === false) return;
    const next = studyCards[index + (side === "left" ? 1 : -1)];
    if (!next) return;
    setDirection(side === "left" ? "next" : "previous");
    setFlipped(false);
    setCurrentCardId(next.id);
    focusIntent.current = "card";
    onStudyAction?.({ ...action, nextCardId: next.id });
  };

  const rateCard = async (rating: "again" | "good") => {
    if (!current || mutationLock.current) return;
    const action: FlashcardStudyActionIntent = {
      type: "rate",
      cardId: current.id,
      rating,
    };
    if (allowStudyAction?.(action) === false) return;
    mutationLock.current = true;
    setRatingPending(true);
    setRatingError("");
    onBusyChange(true);
    try {
      await onRate(current, rating);
      const nextRatings = { ...ratings, [current.id]: rating === "good" };
      setRatings(nextRatings);
      const next = [
        ...studyCards.slice(index + 1),
        ...studyCards.slice(0, index),
      ].find((card) => typeof nextRatings[card.id] !== "boolean");
      setFlipped(false);
      if (next) {
        focusIntent.current = "card";
        setDirection("next");
        setCurrentCardId(next.id);
      } else {
        focusIntent.current = "result";
        setShowSummary(true);
      }
      onStudyAction?.({ ...action, nextCardId: next?.id ?? null });
    } catch {
      setRatingError(
        "학습 기록을 저장하지 못했어요. 선택한 버튼을 다시 눌러주세요.",
      );
      focusIntent.current = "card";
    } finally {
      mutationLock.current = false;
      setRatingPending(false);
      onBusyChange(false);
    }
  };

  useImperativeHandle(
    studyControlsRef,
    () => ({ flip: flipCard, swipe: swipeCard, rate: rateCard }),
    [flipCard, swipeCard, rateCard],
  );

  const restart = (onlyWrong: boolean) => {
    if (mutationLock.current) return;
    const ids = (onlyWrong ? wrongCards : cards).map((card) => card.id);
    if (!ids.length) return;
    setStudyIds(ids);
    setShuffledIds(null);
    setRatings({});
    setRatingError("");
    setRetrying(onlyWrong);
    setShowSummary(false);
    setDirection("next");
    setFlipped(false);
    setCurrentCardId(ids[0]);
    focusIntent.current = "card";
  };

  const selectManagedCard = (card: Flashcard) => {
    if (mutationLock.current) return;
    if (!studyIds.includes(card.id)) {
      setStudyIds(cards.map((item) => item.id));
      setShuffledIds(null);
      setRetrying(false);
    }
    focusIntent.current = "card";
    setCurrentCardId(card.id);
    setFlipped(false);
    setShowSummary(false);
    setManaging(false);
    setConfirmDeleteId(null);
  };

  const deleteCard = async (cardId: string) => {
    if (mutationLock.current) return;
    mutationLock.current = true;
    setDeletingId(cardId);
    onBusyChange(true);
    try {
      await onDelete(cardId);
      setConfirmDeleteId(null);
      focusIntent.current = "manager";
      if (current?.id === cardId) {
        setCurrentCardId(
          studyCards[index + 1]?.id ??
            studyCards[index - 1]?.id ??
            cards.find((card) => card.id !== cardId)?.id ??
            null,
        );
        setFlipped(false);
      }
    } catch {
      // The parent shows the delete error; leave the confirmation available.
    } finally {
      mutationLock.current = false;
      setDeletingId(null);
      onBusyChange(false);
    }
  };

  return (
    <section
      aria-label={`${name} 카드 학습`}
      className="space-y-3 sm:space-y-4"
    >
      <div className="px-1">
        <h2 className="text-base font-bold text-foreground">
          카드 학습
          <span className="ml-2 text-xs font-normal text-muted-foreground">
            총 {cards.length}장
          </span>
        </h2>
        {retrying && (
          <p className="mt-1 text-xs text-muted-foreground">
            다시 볼 카드 {studyCards.length}장 다시 학습 중
          </p>
        )}
        <div className="mt-3 flex items-center gap-5">
          <button
            ref={managementButtonRef}
            type="button"
            disabled={busy}
            onClick={() => setManaging((prev) => !prev)}
            aria-expanded={managing}
            aria-controls="flashcard-management"
            className="flex min-h-10 items-center gap-1.5 rounded-lg px-1 text-xs font-semibold text-muted-foreground transition hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 disabled:opacity-50"
          >
            {managing ? (
              <X aria-hidden="true" className="h-3.5 w-3.5" />
            ) : (
              <List aria-hidden="true" className="h-3.5 w-3.5" />
            )}
            {managing ? "관리 닫기" : "카드 관리"}
          </button>
          {!showSummary && (
            <button
              type="button"
              onClick={shuffle}
              disabled={busy || studyCards.length < 2}
              className="ml-auto flex min-h-10 shrink-0 items-center gap-1.5 rounded-lg px-1 text-xs font-semibold text-muted-foreground transition hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 disabled:opacity-40"
            >
              <Shuffle aria-hidden="true" className="h-3.5 w-3.5" />
              섞기
            </button>
          )}
        </div>
      </div>

      {managing && (
        <div
          id="flashcard-management"
          className="max-h-72 space-y-3 overflow-y-auto px-1 pb-2"
        >
          {cards.map((card, cardIndex) => (
            <div key={card.id} className="flex items-center gap-4 py-2">
              <span className="text-xs tabular-nums text-muted-foreground">
                {String(cardIndex + 1).padStart(2, "0")}
              </span>
              <button
                type="button"
                disabled={busy}
                onClick={() => selectManagedCard(card)}
                className="min-w-0 flex-1 py-2 text-left text-sm font-semibold text-foreground hover:text-brand disabled:opacity-50"
              >
                <span className="block truncate">{cardTitle(card)}</span>
              </button>
              {confirmDeleteId === card.id ? (
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void deleteCard(card.id)}
                    className="flex h-9 items-center gap-1 rounded-lg bg-rose-50 px-2 text-xs font-bold text-rose-600 disabled:opacity-50"
                  >
                    {deletingId === card.id && (
                      <PillLoader size={20} decorative />
                    )}
                    삭제 확인
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => setConfirmDeleteId(null)}
                    aria-label="삭제 취소"
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted disabled:opacity-50"
                  >
                    <X aria-hidden="true" className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => setConfirmDeleteId(card.id)}
                  aria-label={`${cardTitle(card)} 카드 삭제`}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
                >
                  <Trash2 aria-hidden="true" className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {showSummary ? (
        <div className="mx-auto max-w-lg px-1 py-10 text-center sm:py-12">
          <span className="mx-auto flex h-14 w-14 items-center justify-center text-brand">
            <Check aria-hidden="true" className="h-7 w-7" />
          </span>
          <h3
            ref={resultHeadingRef}
            tabIndex={-1}
            className="mt-5 text-2xl font-bold text-foreground outline-none"
          >
            학습 완료
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            {reviewedCards.length
              ? `카드 ${reviewedCards.length}장 · 정답률 ${accuracy}%`
              : "이번 학습에 남은 카드가 없어요"}
          </p>
          <div
            data-flashcard-tutorial="results"
            className="mt-8 grid grid-cols-2 gap-8"
          >
            <div className="px-3 py-3">
              <p className="text-sm font-semibold text-muted-foreground">
                기억했어요
              </p>
              <p className="mt-1 text-3xl font-bold text-emerald-700">
                {correctCount}
              </p>
            </div>
            <div className="px-3 py-3">
              <p className="text-sm font-semibold text-muted-foreground">
                다시 볼래요
              </p>
              <p className="mt-1 text-3xl font-bold text-rose-600">
                {wrongCards.length}
              </p>
            </div>
          </div>
          <div className="mt-8 space-y-4">
            {wrongCards.length > 0 && (
              <button
                type="button"
                disabled={busy}
                onClick={() => restart(true)}
                className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold text-brand transition hover:bg-primary-980 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:opacity-50"
              >
                <RotateCcw aria-hidden="true" className="h-4 w-4" />
                다시 볼 카드 다시 학습
              </button>
            )}
            <button
              type="button"
              disabled={busy || !cards.length}
              onClick={() => restart(false)}
              className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 text-sm font-bold text-white disabled:opacity-50"
            >
              <RotateCcw aria-hidden="true" className="h-4 w-4" />
              전체 다시 학습
            </button>
          </div>
        </div>
      ) : current ? (
        <div
          ref={deckRef}
          className="overflow-hidden pb-2 sm:px-5"
          aria-busy={ratingPending}
          onKeyDown={(event) => {
            const target = event.target as HTMLElement;
            if (
              busy ||
              event.altKey ||
              event.ctrlKey ||
              event.metaKey ||
              target.closest(
                '[data-no-swipe], input, textarea, select, [contenteditable="true"]',
              )
            )
              return;
            if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
              event.preventDefault();
              if (!event.repeat)
                void swipeCard(event.key === "ArrowLeft" ? "right" : "left");
            } else if (
              (event.key === "Enter" || event.key === " ") &&
              !target.closest("button")
            ) {
              event.preventDefault();
              if (!event.repeat) void flipCard();
            }
          }}
        >
          <FlashcardStack
            card={current}
            positionLabel={
              index >= 0 ? `${index + 1} / ${studyCards.length}` : "선택한 카드"
            }
            saving={ratingPending}
            flipped={flipped}
            onFlip={() => void flipCard()}
            onSwipe={(side) => void swipeCard(side)}
            disabled={busy}
            direction={direction}
          />
          <div
            data-flashcard-tutorial="rating"
            className="mt-3 grid grid-cols-2 gap-3"
          >
            <Button
              variant="outline"
              disabled={busy}
              onClick={() => void rateCard("again")}
            >
              다시 볼래요
            </Button>
            <Button disabled={busy} onClick={() => void rateCard("good")}>
              기억했어요
            </Button>
          </div>
          {ratingError && (
            <p role="alert" className="mt-3 text-body-medium text-destructive">
              {ratingError}
            </p>
          )}
          <p className="mt-3 text-center text-body-small text-muted-foreground">
            카드를 넘기거나 뒤집은 뒤 두 버튼으로 학습 상태를 기록해요.
          </p>
          <div className="sr-only">
            <p aria-live="polite" aria-atomic="true">
              {index >= 0
                ? `${index + 1} / ${studyCards.length}`
                : "선택한 카드"}
            </p>
            {ratingPending && (
              <LoadingIndicator inline label="학습 기록 저장 중" />
            )}
          </div>
        </div>
      ) : null}
    </section>
  );
}
