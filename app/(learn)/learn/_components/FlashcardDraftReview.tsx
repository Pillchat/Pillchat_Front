"use client";

import { Loader2, Plus, Trash2 } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { FlashcardDraft } from "@/types/flashcard";

type ConceptDraft = Extract<FlashcardDraft, { type: "concept" }>;

export type FlashcardReviewItem = {
  id: string;
  draft: FlashcardDraft;
  source: "ai" | "manual";
};

function questionText(draft: FlashcardDraft) {
  if (draft.type === "concept") return draft.term || "앞면 없음";
  if (draft.type === "relation") return draft.trigger || "앞면 없음";
  if (draft.type === "compare") return `${draft.nameA} / ${draft.nameB}`;
  return draft.title || "이미지 카드";
}

function DraftAnswer({ draft }: { draft: FlashcardDraft }) {
  if (draft.type === "blind") {
    return (
      <div className="space-y-3">
        <p className="text-sm font-medium text-brand">
          가림막 {draft.masks.length}개
        </p>
        <img
          src={draft.imageUrl}
          alt={draft.title || "이미지 카드"}
          className="max-h-72 w-full rounded-xl object-contain"
        />
      </div>
    );
  }

  const answer =
    draft.type === "concept"
      ? draft.definition
      : draft.type === "relation"
        ? draft.effect
        : draft.common;
  const detail =
    draft.type === "relation"
      ? draft.mechanism
      : draft.type === "compare"
        ? draft.difference
        : "";

  return (
    <div className="space-y-4">
      {draft.type === "compare" && (
        <p className="text-xs font-medium text-muted-foreground">공통점</p>
      )}
      <p className="whitespace-pre-wrap break-words text-base font-medium leading-7 text-brand [overflow-wrap:anywhere]">
        {answer}
      </p>
      {detail && (
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground">
            {draft.type === "relation" ? "작용 원리" : "차이점"}
          </p>
          <p className="whitespace-pre-wrap break-words text-sm leading-6 text-brand [overflow-wrap:anywhere]">
            {detail}
          </p>
        </div>
      )}
    </div>
  );
}

export function FlashcardDraftReview({
  items,
  onRemove,
  onAdd,
  onComplete,
  disabled = false,
}: {
  items: FlashcardReviewItem[];
  onRemove: (id: string) => void;
  onAdd: (draft: ConceptDraft) => void;
  onComplete: (pendingDraft?: ConceptDraft) => Promise<void>;
  disabled?: boolean;
}) {
  const fieldId = useId();
  const termRef = useRef<HTMLInputElement>(null);
  const completeLock = useRef(false);
  const [adding, setAdding] = useState(false);
  const [term, setTerm] = useState("");
  const [definition, setDefinition] = useState("");
  const [completing, setCompleting] = useState(false);
  const [error, setError] = useState("");
  const busy = disabled || completing;
  const trimmedTerm = term.trim();
  const trimmedDefinition = definition.trim();
  const hasInput = Boolean(trimmedTerm || trimmedDefinition);
  const validInput = Boolean(trimmedTerm && trimmedDefinition);
  const canComplete =
    (!hasInput || validInput) && (items.length > 0 || validInput);

  useEffect(() => {
    if (adding) termRef.current?.focus();
  }, [adding]);

  const currentDraft = (): ConceptDraft => ({
    type: "concept",
    term: trimmedTerm,
    definition: trimmedDefinition,
  });

  const addCard = () => {
    if (busy || completeLock.current || !validInput) return;
    try {
      onAdd(currentDraft());
      setTerm("");
      setDefinition("");
      setError("");
      termRef.current?.focus();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "카드를 추가하지 못했어요.",
      );
    }
  };

  const complete = async () => {
    if (busy || completeLock.current || !canComplete) return;
    completeLock.current = true;
    setCompleting(true);
    setError("");
    try {
      await onComplete(validInput ? currentDraft() : undefined);
      setTerm("");
      setDefinition("");
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "카드를 저장하지 못했어요. 다시 시도해 주세요.",
      );
    } finally {
      completeLock.current = false;
      setCompleting(false);
    }
  };

  return (
    <section className="space-y-6" aria-labelledby={`${fieldId}-heading`}>
      <div>
        <div className="flex items-center gap-3">
          <h2
            id={`${fieldId}-heading`}
            className="text-lg font-bold text-foreground"
            aria-live="polite"
          >
            카드 {items.length}장
          </h2>
        </div>
      </div>

      {items.length ? (
        <ul className="grid gap-4 sm:grid-cols-2">
          {items.map((item, index) => (
            <li key={item.id} className="rounded-2xl bg-accent/60 p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <p className="text-xs text-muted-foreground">
                  {String(index + 1).padStart(2, "0")} ·{" "}
                  {item.source === "manual" ? "직접 추가" : "AI 생성"}
                </p>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    if (!busy && !completeLock.current) onRemove(item.id);
                  }}
                  aria-label={`${questionText(item.draft)} 카드 삭제`}
                  className="-mr-2 -mt-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-rose-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:opacity-40"
                >
                  <Trash2 aria-hidden="true" className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-5">
                <div>
                  <p className="mb-1.5 text-xs text-muted-foreground">앞면</p>
                  <h3 className="whitespace-pre-wrap break-words text-base font-bold leading-7 text-foreground [overflow-wrap:anywhere]">
                    {questionText(item.draft)}
                  </h3>
                </div>
                <div>
                  <p className="mb-1.5 text-xs text-muted-foreground">뒷면</p>
                  <DraftAnswer draft={item.draft} />
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="py-5 text-center text-sm text-muted-foreground">
          직접 카드를 추가해 주세요.
        </p>
      )}

      {adding && (
        <div className="space-y-4">
          <div>
            <label
              htmlFor={`${fieldId}-term`}
              className="mb-2 block text-sm font-semibold text-foreground"
            >
              앞면
            </label>
            <Input
              ref={termRef}
              id={`${fieldId}-term`}
              value={term}
              disabled={busy}
              onChange={(event) => {
                setTerm(event.target.value);
                setError("");
              }}
              placeholder="질문이나 암기할 용어"
              className="border-0 bg-accent/60 focus-visible:border-0 focus-visible:ring-2 focus-visible:ring-brand"
            />
          </div>
          <div>
            <label
              htmlFor={`${fieldId}-definition`}
              className="mb-2 block text-sm font-semibold text-foreground"
            >
              뒷면
            </label>
            <Textarea
              id={`${fieldId}-definition`}
              value={definition}
              disabled={busy}
              onChange={(event) => {
                setDefinition(event.target.value);
                setError("");
              }}
              placeholder="정답이나 설명"
              className="min-h-28 border-0 bg-accent/60 text-brand shadow-none focus-visible:ring-2 focus-visible:ring-brand"
            />
          </div>
        </div>
      )}

      {error && (
        <p role="alert" className="text-sm leading-6 text-rose-600">
          {error}
        </p>
      )}
      <div className="grid grid-cols-2 gap-3" aria-busy={completing}>
        {adding ? (
          <Button
            type="button"
            variant="ghost"
            disabled={busy || !validInput}
            onClick={addCard}
            className="bg-accent/60 text-brand"
          >
            카드 추가
          </Button>
        ) : (
          <Button
            type="button"
            variant="ghost"
            disabled={busy}
            onClick={() => setAdding(true)}
            className="bg-accent/60 text-brand"
          >
            <Plus aria-hidden="true" className="mr-1 !h-4 !w-4" />
            직접 카드 추가
          </Button>
        )}
        <Button
          type="button"
          disabled={busy || !canComplete}
          onClick={() => void complete()}
        >
          {completing && (
            <Loader2
              aria-hidden="true"
              className="mr-2 !h-4 !w-4 animate-spin"
            />
          )}
          제작 완료
        </Button>
      </div>
    </section>
  );
}
