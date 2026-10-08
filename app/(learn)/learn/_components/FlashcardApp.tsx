"use client";

import { PillLoader } from "@/components/atoms/PillLoader";

import { LearningCommands } from "@/lib/learning/api";
import FlashcardGeneration from "@/components/learning/FlashcardGeneration";

import Link from "next/link";

import {
  BadgeCheck,
  CalendarDays,
  Eraser,
  EyeOff,
  FileUp,
  PenLine,
  Plus,
  Sparkles,
  Square,
  X,
} from "lucide-react";
import { ChangeEvent, PointerEvent, useEffect, useRef, useState } from "react";

import { Toast } from "@/components/atoms";
import { AppShell, PracticeHeader } from "@/components/molecules";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  createRemoteFlashcard,
  fetchRemotePackNames,
  deleteRemoteFlashcard,
  fetchAllFlashcards,
  mergeFlashcards,
  reviewRemoteFlashcard,
} from "@/lib/flashcards/api";
import {
  readFlashcardCollections,
  writeFlashcardCollections,
  type FlashcardCollectionMap,
} from "@/lib/flashcards/collections";
import { useRouter } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import {
  createMaskId,
  downscaleImage,
  readFileAsDataUrl,
} from "@/lib/flashcards/storage";
import { FlashcardLibraryPanel } from "./FlashcardLibraryPanel";

import type {
  BlindMask,
  Flashcard,
  FlashcardDraft,
  Rating,
} from "@/types/flashcard";

type CreateMode = "ai" | "manual" | "blind";
type CollectionMode = "subject" | "date";
type BlindTool = "box" | "pen" | "eraser";

const emptyConcept = { term: "", definition: "" };

function formatCollectionDate(value = Date.now()) {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(value);
}

function isDateCollectionTitle(value: string) {
  return /^\d{4}년 \d{1,2}월 \d{1,2}일$/.test(value);
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

function useFlashcardData() {
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [ready, setReady] = useState(false);
  const [toast, setToast] = useState("");

  const refresh = async ({ showLoading = false } = {}) => {
    if (showLoading) setReady(false);

    try {
      setCards(await fetchAllFlashcards());

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
    ready,
    toast,
    setToast,
    setCards,
    refresh,
  };
}

function CreateActions({
  busy,
  addDisabled,
  completeDisabled,
  onAdd,
  onComplete,
}: {
  busy: boolean;
  addDisabled: boolean;
  completeDisabled: boolean;
  onAdd: () => void;
  onComplete: () => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <Button
        type="button"
        variant="ghost"
        onClick={onAdd}
        disabled={busy || addDisabled}
        className="bg-gray-100 text-foreground"
      >
        카드 추가
      </Button>
      <Button
        type="button"
        onClick={onComplete}
        disabled={busy || completeDisabled}
      >
        {busy && <PillLoader size={24} className="mr-2" />}
        제작 완료
      </Button>
    </div>
  );
}

function ManualCreateForm({
  onAdd,
  onComplete,
  onBusyChange,
  hasCreated,
  disabled = false,
  saveDisabled = false,
}: {
  onAdd: (draft: FlashcardDraft, complete: boolean) => Promise<void> | void;
  onComplete: () => void;
  onBusyChange: (busy: boolean) => void;
  hasCreated: boolean;
  disabled?: boolean;
  saveDisabled?: boolean;
}) {
  const [concept, setConcept] = useState(emptyConcept);
  const [saving, setSaving] = useState(false);
  const saveLock = useRef(false);
  const valid = !!concept.term.trim() && !!concept.definition.trim();
  const hasInput = !!concept.term.trim() || !!concept.definition.trim();

  const handleSubmit = async (complete: boolean) => {
    const term = concept.term.trim();
    const definition = concept.definition.trim();
    if (disabled || saveLock.current) return;
    if (complete && !hasInput && hasCreated) {
      onComplete();
      return;
    }
    if (!term || !definition || saveDisabled) return;

    saveLock.current = true;
    setSaving(true);
    onBusyChange(true);
    try {
      await onAdd({ type: "concept", term, definition }, complete);
      setConcept(emptyConcept);
    } catch {
      // The parent surfaces the save error through its toast.
    } finally {
      saveLock.current = false;
      setSaving(false);
      onBusyChange(false);
    }
  };

  return (
    <div className="space-y-4 rounded-2xl border border-border p-4">
      <div>
        <label className="mb-2 block text-sm font-bold text-foreground">
          앞면
        </label>
        <Input
          disabled={disabled || saving}
          value={concept.term}
          onChange={(event) =>
            setConcept((prev) => ({ ...prev, term: event.target.value }))
          }
          placeholder="질문이나 암기할 용어"
        />
      </div>
      <div>
        <label className="mb-2 block text-sm font-bold text-foreground">
          뒷면
        </label>
        <Textarea
          disabled={disabled || saving}
          value={concept.definition}
          onChange={(event) =>
            setConcept((prev) => ({
              ...prev,
              definition: event.target.value,
            }))
          }
          placeholder="정답이나 설명"
          className="min-h-32"
        />
      </div>

      <CreateActions
        busy={disabled || saving}
        addDisabled={saveDisabled || !valid}
        completeDisabled={hasInput ? saveDisabled || !valid : !hasCreated}
        onAdd={() => void handleSubmit(false)}
        onComplete={() => void handleSubmit(true)}
      />
    </div>
  );
}

function CreatePanel({
  onAddMany,
  onComplete,
  initialCollection = "",
}: {
  onAddMany: (
    drafts: FlashcardDraft[],
    collection: string,
  ) => Promise<void> | void;
  onComplete: () => void;
  initialCollection?: string;
}) {
  const initialCollectionIsDate = isDateCollectionTitle(initialCollection);
  const [mode, setMode] = useState<CreateMode>("ai");
  const [collectionMode, setCollectionMode] = useState<CollectionMode>(
    initialCollectionIsDate ? "date" : "subject",
  );
  const [collectionName, setCollectionName] = useState(
    initialCollectionIsDate ? "" : initialCollection,
  );
  const [dateCollection] = useState(
    initialCollectionIsDate ? initialCollection : formatCollectionDate(),
  );
  const [formBusy, setFormBusy] = useState(false);
  const [hasCreated, setHasCreated] = useState(false);
  const [error, setError] = useState("");
  const collection =
    collectionMode === "subject" ? collectionName.trim() : dateCollection;
  const busy = formBusy;

  const saveDrafts = async (drafts: FlashcardDraft[], complete: boolean) => {
    await onAddMany(drafts, collection);
    setHasCreated(true);

    if (complete) onComplete();
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="mb-2 block text-sm font-bold text-foreground">
          통합 카드 분류
        </label>
        <div className="grid grid-cols-2 gap-1 rounded-xl bg-gray-100 p-1">
          {(
            [
              { key: "subject", label: "과목" },
              { key: "date", label: "날짜" },
            ] as Array<{ key: CollectionMode; label: string }>
          ).map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setCollectionMode(item.key)}
              disabled={busy}
              className={cn(
                "h-10 rounded-lg text-sm font-bold text-muted-foreground transition",
                collectionMode === item.key &&
                  "bg-white text-foreground shadow-sm",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {collectionMode === "subject" ? (
        <div>
          <label className="mb-2 flex items-center gap-2 text-sm font-bold text-foreground">
            과목 이름
            <span className="text-xs font-semibold text-brand">필수</span>
          </label>
          <Input
            value={collectionName}
            disabled={busy}
            onChange={(event) => setCollectionName(event.target.value)}
            placeholder="예: 약제학"
          />
        </div>
      ) : (
        <div>
          <p className="mb-2 text-sm font-bold text-foreground">
            통합 카드 제목
          </p>
          <div className="flex h-12 items-center gap-2 rounded-xl border border-border bg-gray-50 px-3 text-sm font-bold text-foreground">
            <CalendarDays aria-hidden="true" className="h-4 w-4 text-brand" />
            {collection}
          </div>
        </div>
      )}

      {
        <div>
          <label className="mb-2 block text-sm font-bold text-foreground">
            카드 생성 방식
          </label>
          <div className="grid grid-cols-3 gap-1 rounded-xl bg-gray-100 p-1">
            {[
              { key: "ai", label: "AI 자동 생성" },
              { key: "manual", label: "직접 만들기" },
              { key: "blind", label: "이미지 가림" },
            ].map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setMode(item.key as CreateMode)}
                disabled={busy}
                className={cn(
                  "min-h-11 rounded-lg px-1 text-[0.8125rem] font-bold leading-5 text-muted-foreground",
                  mode === item.key && "bg-white text-foreground shadow-sm",
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      }

      {mode === "ai" && (
        <FlashcardGeneration title={collection} onBusyChange={setFormBusy} />
      )}

      {mode === "manual" && (
        <ManualCreateForm
          disabled={busy}
          saveDisabled={!collection}
          hasCreated={hasCreated}
          onBusyChange={setFormBusy}
          onAdd={(draft, complete) => saveDrafts([draft], complete)}
          onComplete={onComplete}
        />
      )}

      {mode === "blind" && (
        <BlindEditor
          saveDisabled={!collection}
          disabled={busy}
          hasCreated={hasCreated}
          onBusyChange={setFormBusy}
          onSave={(draft, complete) => saveDrafts([draft], complete)}
          onComplete={onComplete}
        />
      )}
    </div>
  );
}

function BlindEditor({
  onSave,
  onComplete,
  onBusyChange,
  hasCreated,
  disabled = false,
  saveDisabled = false,
}: {
  onSave: (draft: FlashcardDraft, complete: boolean) => Promise<void> | void;
  onComplete: () => void;
  onBusyChange: (busy: boolean) => void;
  hasCreated: boolean;
  disabled?: boolean;
  saveDisabled?: boolean;
}) {
  const stageRef = useRef<HTMLDivElement>(null);
  const draftStartRef = useRef<{ x: number; y: number } | null>(null);
  const lastStrokePointRef = useRef<{ x: number; y: number } | null>(null);
  const activeStrokeIdRef = useRef<string | null>(null);
  const [title, setTitle] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [masks, setMasks] = useState<BlindMask[]>([]);
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
  const saveLock = useRef(false);
  const valid = !!title.trim() && !!imageUrl && masks.length > 0;
  const hasInput = !!title.trim() || !!imageUrl || masks.length > 0;

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
    if (disabled || saveLock.current) return;
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

    saveLock.current = true;
    setSaving(true);
    onBusyChange(true);
    try {
      const dataUrl = await readFileAsDataUrl(file);
      setImageUrl(dataUrl);
      setMasks([]);
      setDraftMask(null);
      activeStrokeIdRef.current = null;
      lastStrokePointRef.current = null;
      draftStartRef.current = null;
    } catch (error) {
      setToast(
        error instanceof Error ? error.message : "이미지를 불러오지 못했어요.",
      );
    } finally {
      saveLock.current = false;
      setSaving(false);
      onBusyChange(false);
    }
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (disabled || saving || !imageUrl || movingMask || resizingMaskId) return;
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

  const handleSave = async (complete: boolean) => {
    const trimmed = title.trim();
    if (disabled || saveLock.current) return;
    if (complete && !hasInput && hasCreated) {
      onComplete();
      return;
    }
    if (!trimmed || !imageUrl || masks.length === 0 || saveDisabled) return;

    saveLock.current = true;
    setSaving(true);
    onBusyChange(true);
    try {
      const compressed = await downscaleImage(imageUrl);
      await onSave(
        {
          type: "blind",
          title: trimmed,
          imageUrl: compressed,
          masks,
        },
        complete,
      );
      setTitle("");
      setImageUrl("");
      setMasks([]);
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
      saveLock.current = false;
      setSaving(false);
      onBusyChange(false);
    }
  };

  const visibleMasks = draftMask ? [...masks, draftMask] : masks;

  const beginMoveMask = (
    event: PointerEvent<HTMLDivElement>,
    mask: BlindMask,
  ) => {
    if (disabled || saving || tool !== "box") return;
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
    if (disabled || saving) return;

    event.stopPropagation();
    stageRef.current?.setPointerCapture(event.pointerId);
    setResizingMaskId(maskId);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border p-4">
        <Input
          value={title}
          disabled={disabled || saving}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="카드 제목"
        />
        <label className="mt-3 flex h-14 cursor-pointer items-center justify-center rounded-xl border border-dashed border-border text-sm font-bold text-muted-foreground">
          JPG/PNG 업로드
          <input
            type="file"
            disabled={disabled || saving}
            accept="image/png,image/jpeg,application/pdf"
            className="sr-only"
            onChange={handleFile}
          />
        </label>
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
            const isStroke = isStrokeMask(mask);

            return (
              <div
                key={mask.id}
                role="button"
                tabIndex={-1}
                onPointerDown={(event) => {
                  if (mask.id !== "draft") beginMoveMask(event, mask);
                }}
                className={cn(
                  "absolute",
                  !isStroke && "border border-white/60 bg-slate-950",
                  isStroke && "text-slate-950",
                  mask.id !== "draft" && "cursor-move",
                )}
                style={{
                  left: `${mask.x * 100}%`,
                  top: `${mask.y * 100}%`,
                  width: `${mask.width * 100}%`,
                  height: `${mask.height * 100}%`,
                }}
                aria-label="가림막"
              >
                {isStroke && <StrokeMaskShape mask={mask} />}
                {mask.id !== "draft" && !isStroke && (
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
                disabled={disabled || saving}
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

      <CreateActions
        busy={disabled || saving}
        addDisabled={saveDisabled || !valid}
        completeDisabled={hasInput ? saveDisabled || !valid : !hasCreated}
        onAdd={() => void handleSave(false)}
        onComplete={() => void handleSave(true)}
      />

      <Toast open={!!toast} message={toast} onClose={() => setToast("")} />
    </div>
  );
}

function FlashcardTutorialLink() {
  return (
    <Link
      href="/flashcards/tutorial"
      aria-label="AI 플래시카드 튜토리얼"
      className="flex h-10 w-10 items-center justify-center rounded-lg text-xl transition hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
    >
      <BadgeCheck aria-hidden="true" className="h-5 w-5 text-primary" />
    </Link>
  );
}

export function FlashcardApp() {
  const { cards, ready, toast, setToast, setCards, refresh } =
    useFlashcardData();
  const [collectionByCardId, setCollectionByCardId] =
    useState<FlashcardCollectionMap>({});
  const [selectedCollection, setSelectedCollection] = useState<string | null>(
    null,
  );

  useEffect(() => {
    if (!ready) return;
    void fetchRemotePackNames()
      .then((names) => {
        setCollectionByCardId(
          Object.fromEntries(
            cards
              .filter((c) => c.packId && names[c.packId])
              .map((c) => [c.id, names[c.packId!]]),
          ),
        );
      })
      .catch((e) => setToast(e.message));
  }, [ready, cards.map((card) => `${card.id}:${card.packId ?? ""}`).join(",")]);

  const deleteCard = async (cardId: string) => {
    try {
      await deleteRemoteFlashcard(cardId);
      setCards((prev) => prev.filter((card) => card.id !== cardId));
      setCollectionByCardId((prev) => {
        const next = { ...prev };
        delete next[cardId];
        writeFlashcardCollections(next);
        return next;
      });
      setToast("카드를 삭제했어요.");
      void refresh();
    } catch (error) {
      setToast(
        error instanceof Error ? error.message : "카드를 삭제하지 못했어요.",
      );
      throw error;
    }
  };

  const handleRate = async (target: Flashcard, rating: Rating) => {
    try {
      const reviewed = await reviewRemoteFlashcard(target.id, rating);
      setCards((prev) =>
        mergeFlashcards(
          prev.map((card) => (card.id === target.id ? reviewed : card)),
          [reviewed],
        ),
      );

      void refresh();
    } catch (error) {
      setToast(
        error instanceof Error ? error.message : "평가를 저장하지 못했어요.",
      );
      throw error;
    }
  };

  if (!ready) {
    return (
      <AppShell bottomNav={false} bottomSpacing="none">
        <PracticeHeader
          title="AI 플래시카드"
          backHref="/"
          separator={false}
          rightSlot={<FlashcardTutorialLink />}
        />
        <div className="flex min-h-[calc(100dvh-4rem)] items-center justify-center">
          <PillLoader size={64} />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell bottomNav={false} bottomSpacing="none">
      <PracticeHeader
        title="AI 플래시카드"
        backHref="/"
        separator={false}
        rightSlot={<FlashcardTutorialLink />}
      />

      <main className="px-4 pb-[calc(2rem+env(safe-area-inset-bottom))] pt-5 sm:px-6">
        <FlashcardLibraryPanel
          cards={cards}
          collectionByCardId={collectionByCardId}
          selectedCollection={selectedCollection}
          onSelectCollection={setSelectedCollection}
          onDelete={deleteCard}
          onRate={handleRate}
        />
      </main>

      <Toast open={!!toast} message={toast} onClose={() => setToast("")} />
    </AppShell>
  );
}

export function FlashcardCreateApp({
  initialCollection = "",
}: {
  initialCollection?: string;
}) {
  const router = useRouter();
  const [toast, setToast] = useState("");
  const createdDrafts = useRef(new WeakMap<FlashcardDraft, Flashcard>());
  const manualPacks = useRef(new Map<string, string>());
  const packCommands = useRef(new LearningCommands());

  const addDrafts = async (drafts: FlashcardDraft[], collection: string) => {
    try {
      if (
        packCommands.current.pending &&
        packCommands.current.pending.body.title !== collection
      )
        throw new Error("이전 팩 이름으로 다시 시도해주세요.");
      let packId = manualPacks.current.get(collection);
      if (!packId) {
        const pack: { packId: string } = packCommands.current.pending
          ? await packCommands.current.retry()
          : await packCommands.current.send("/api/flashcard-packs", "POST", {
              title: collection,
              groupKind: "UNCLASSIFIED",
            });
        packId = pack.packId;
        manualPacks.current.set(collection, packId);
      }
      const createdCards: Flashcard[] = [];
      for (const draft of drafts) {
        let card = createdDrafts.current.get(draft);
        if (!card) {
          card = await createRemoteFlashcard(draft, packId);
          createdDrafts.current.set(draft, card);
        }
        createdCards.push(card);
      }
      const nextCollections = readFlashcardCollections();

      createdCards.forEach((card) => {
        nextCollections[card.id] = collection;
      });
      writeFlashcardCollections(nextCollections);
      setToast(`${createdCards.length}장의 카드를 저장했어요.`);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "카드를 저장하지 못했어요.";
      setToast(message);
      throw new Error(message);
    }
  };

  return (
    <AppShell bottomNav={false} bottomSpacing="none">
      <PracticeHeader title="카드 만들기" backHref="/flashcards" />

      <main className="px-4 pb-[calc(2rem+env(safe-area-inset-bottom))] pt-5 sm:px-6">
        <CreatePanel
          initialCollection={initialCollection}
          onAddMany={addDrafts}
          onComplete={() => router.replace("/flashcards")}
        />
      </main>

      <Toast open={!!toast} message={toast} onClose={() => setToast("")} />
    </AppShell>
  );
}
