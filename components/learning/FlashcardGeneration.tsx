"use client";
import { FileUp, FileText } from "lucide-react";
import {
  flashcardErrorMessage,
  generationFailureMessage,
  FLASHCARD_FIELD_LABELS,
} from "@/lib/flashcards/messages";
import { PillLoader } from "@/components/atoms/PillLoader";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ApiError, fetchAPI } from "@/lib/client/fetch";
import { LearningCommands } from "@/lib/learning/api";

import {
  FlashcardReview,
  uploadFlashcardSource,
  type GeneratedCard as Card,
  type CardGeneration as Generation,
  type GenerationPack as Pack,
} from "@/lib/flashcards/generation";

export default function FlashcardGeneration({
  packId,
  newPackTitle,
  onPackCreated,
  onBusyChange,
  onSaved,
}: {
  packId: string;
  newPackTitle?: string;
  onPackCreated?: (pack: Pack) => void;
  onSaved?: () => Promise<void>;
  onBusyChange?: (busy: boolean) => void;
}) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [pack, setPack] = useState<Pack | null>(null);
  const [generation, setGeneration] = useState<Generation | null>(null);
  const [count, setCount] = useState(5);
  const [cardType, setCardType] = useState("CONCEPT");
  const [busy, setBusy] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [edits, setEdits] = useState<Record<string, Card>>({});
  const [removed, setRemoved] = useState<string[]>([]);
  const [source, setSource] = useState<{ name?: string; id?: string } | null>(
    null,
  );
  const [saved, setSaved] = useState(false);
  const workflow = useRef<{
    file: File;
    packId: string;
    uploadKey: string;
    title: string;
    cardType: string;
    count: number;
    sourceId?: string;
    pack?: Pack;
  } | null>(null);
  const commands = useRef(new LearningCommands());
  const review = useRef<FlashcardReview | null>(null);
  const pendingAction = useRef<(() => Promise<void>) | null>(null);
  const locked = useRef(false);
  const revision = useRef(0);
  const refresh = async (id: string) => {
    const requestRevision = revision.current;
    const next: Generation = await fetchAPI(
      `/api/flashcards/generations/${encodeURIComponent(id)}`,
      "GET",
    );
    if (
      String(next.packId) !==
      String(packId || workflow.current?.pack?.packId || pack?.packId)
    )
      throw new Error("이 작업이 속한 카드팩을 먼저 선택해 주세요.");
    const nextPack = await fetchAPI(
      `/api/flashcard-packs/${next.packId}`,
      "GET",
    );
    if (requestRevision === revision.current) {
      setGeneration(next);
      setPack(nextPack);
      setSource(
        (previous) =>
          previous ?? { id: next.sourceFileId, name: next.sourceFileName },
      );
    }
    return next;
  };
  useEffect(() => {
    if (!packId) return;
    const id = new URLSearchParams(window.location.search).get("generation");
    if (id) {
      setRestoring(true);
      void refresh(id)
        .catch((e) => setError(flashcardErrorMessage(e)))
        .finally(() => setRestoring(false));
    }
  }, [packId]);
  useEffect(() => {
    if (!generation || ["READY", "FAILED"].includes(generation.status)) return;
    const timer = setInterval(() => {
      if (
        !locked.current &&
        document.visibilityState === "visible" &&
        navigator.onLine
      )
        void refresh(generation.generationId).catch((e) =>
          setError(flashcardErrorMessage(e)),
        );
    }, 3000);
    return () => clearInterval(timer);
  }, [generation?.generationId, generation?.status]);
  const run = async (action: () => Promise<void>) => {
    if (locked.current) return;
    revision.current += 1;
    locked.current = true;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await action();
      pendingAction.current = null;
    } catch (e) {
      setError(flashcardErrorMessage(e));
      if (!(e instanceof ApiError) || e.status >= 500 || e.status === 408)
        pendingAction.current = action;
      else {
        pendingAction.current = null;
        review.current = null;
        if (e.status === 409) {
          if (workflow.current) workflow.current.pack = undefined;
          if (generation)
            await refresh(generation.generationId).catch(() => undefined);
        }
      }
    } finally {
      locked.current = false;
      setBusy(false);
    }
  };
  // Each pipeline stage resumes from its last confirmed result; uncertain requests keep their key/body.
  const send = <T,>(
    url: string,
    body: Record<string, unknown>,
    method = "POST",
  ) =>
    commands.current.pending
      ? commands.current.retry<T>()
      : commands.current.send<T>(url, method, body);
  const generate = async () => {
    if (!file || (!packId && !newPackTitle?.trim())) return;
    if (!workflow.current)
      workflow.current = {
        file,
        packId,
        uploadKey: crypto.randomUUID(),
        title: newPackTitle?.trim() ?? "",
        cardType,
        count,
      };
    const flow = workflow.current;
    if (!flow.sourceId) {
      flow.sourceId = await uploadFlashcardSource(flow.file, flow.uploadKey);
    }
    if (!flow.pack) {
      flow.pack = flow.packId
        ? await fetchAPI(
            `/api/flashcard-packs/${encodeURIComponent(flow.packId)}`,
            "GET",
          )
        : await send<Pack>("/api/flashcard-packs", {
            title: flow.title,
            sourceFileId: flow.sourceId,
            groupKind: "UNCLASSIFIED",
          });
      if (flow.pack) flow.packId = String(flow.pack.packId);
    }
    if (!flow.pack) throw new Error("카드팩을 불러오지 못했어요.");
    setPack(flow.pack);
    setSource({ name: flow.file.name, id: flow.sourceId });
    const next = await send<Generation>(
      `/api/flashcard-packs/${flow.pack.packId}/generations`,
      {
        expectedVersion: flow.pack.version,
        sourceFileId: flow.sourceId,
        cardType,
        count,
      },
    );
    setSaved(false);
    setGeneration(next);
    setEdits({});
    setRemoved([]);
    const url = new URL(window.location.href);
    url.searchParams.set("generation", next.generationId);
    url.searchParams.set("pack", String(flow.pack.packId));
    window.history.replaceState(null, "", url);
    await refresh(next.generationId).catch((e) =>
      setError(flashcardErrorMessage(e)),
    );
    if (!packId) onPackCreated?.(flow.pack);
    workflow.current = null;
  };
  const save = async () => {
    if (!generation || !pack) return;
    review.current ??= new FlashcardReview(generation, edits, removed);
    const next = await review.current.finalize();
    setGeneration(next);
    setEdits({});
    setRemoved([]);
    review.current = null;
    setSaved(true);
    await refresh(generation.generationId).catch((e) =>
      setError(flashcardErrorMessage(e)),
    );
    await onSaved?.().catch(() =>
      setError("카드는 저장했지만 카드 목록을 불러오지 못했어요."),
    );
    setMessage("카드를 저장했습니다. 카드 목록에서 학습할 수 있습니다.");
  };
  const saveDrafts = async () => {
    if (!generation) return;
    review.current ??= new FlashcardReview(generation, edits, removed);
    const next = await review.current.saveChanges();
    setGeneration(next);
    setEdits({});
    setRemoved([]);
    review.current = null;
    // Updating drafts may also advance the pack version.
    await refresh(next.generationId).catch((e) =>
      setError(flashcardErrorMessage(e)),
    );
    setMessage("초안 변경을 저장했습니다.");
  };
  const disabled = busy || restoring || !!pendingAction.current;
  const processing =
    !!generation && !["READY", "FAILED"].includes(generation.status);
  const visibleDrafts = (generation?.drafts ?? []).filter(
    (draft) => draft.state === "EDITABLE" && !removed.includes(draft.draftId),
  );
  const hasDrafts =
    !saved &&
    generation?.status === "READY" &&
    (visibleDrafts.length > 0 ||
      removed.length > 0 ||
      Object.keys(edits).length > 0);
  const editingDisabled = disabled || generation?.status !== "READY" || saved;
  const inputDisabled = disabled || processing || hasDrafts;
  useEffect(() => {
    onBusyChange?.(inputDisabled);
  }, [inputDisabled, onBusyChange]);
  return (
    <section className="space-y-4 rounded-2xl border p-4">
      {error && (
        <p role="alert" className="text-destructive">
          {error}
        </p>
      )}
      {message && <p role="status">{message}</p>}
      {pendingAction.current && (
        <Button
          disabled={busy}
          onClick={() => void run(pendingAction.current!)}
        >
          다시 시도
        </Button>
      )}
      <p className="text-sm text-muted-foreground">
        학습자료를 선택하면 AI가 카드를 만들어요. 내용을 확인하고 카드팩에
        저장해 주세요.
      </p>
      <div className="space-y-3 rounded-xl bg-accent/40 p-4">
        <input
          ref={fileInput}
          className="sr-only"
          tabIndex={-1}
          aria-label="카드 원본 파일"
          type="file"
          accept=".pdf,.png,.jpg,.jpeg,.txt,.md,.csv"
          disabled={inputDisabled}
          onChange={(event) => {
            const next = event.target.files?.[0];
            if (!next) return;
            if (next.size === 0 || next.size > 30 * 1024 * 1024) {
              setError(
                next.size === 0
                  ? "내용이 없는 파일이에요. 다른 자료를 선택해 주세요."
                  : "30MB 이하의 자료를 선택해 주세요.",
              );
              event.target.value = "";
              return;
            }
            setFile(next);
            setError("");
            workflow.current = null;
          }}
        />
        <Button
          type="button"
          variant="outline"
          className="w-full bg-white"
          disabled={inputDisabled}
          onClick={() => fileInput.current?.click()}
        >
          <FileUp className="mr-2 h-4 w-4" aria-hidden="true" />
          {file ? "다른 자료 선택" : "학습자료 선택"}
        </Button>
        <p className="text-xs leading-5 text-muted-foreground">
          PDF, 이미지 또는 텍스트 자료 · 최대 30MB
        </p>
        {file && (
          <div className="flex items-start gap-2 text-sm">
            <FileText
              aria-hidden="true"
              className="mt-0.5 h-4 w-4 shrink-0 text-brand"
            />
            <div className="min-w-0">
              <p className="break-all font-medium">{file.name}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {(file.size / 1024 / 1024).toFixed(1)} MB
              </p>
            </div>
          </div>
        )}
      </div>
      {!packId && !newPackTitle?.trim() && (
        <p className="text-sm text-muted-foreground">
          저장할 카드팩을 먼저 선택해 주세요.
        </p>
      )}
      <div className="grid grid-cols-2 gap-3">
        <label className="space-y-2 text-sm font-semibold">
          카드 형태
          <select
            className="h-11 w-full rounded-xl border bg-white px-3 font-normal"
            aria-label="카드 유형"
            value={cardType}
            disabled={inputDisabled}
            onChange={(e) => setCardType(e.target.value)}
          >
            {["CONCEPT", "RELATION", "COMPARE"].map((t, i) => (
              <option key={t} value={t}>
                {["개념", "인과", "비교"][i]}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-2 text-sm font-semibold">
          만들 카드 수
          <input
            aria-label="카드 수"
            className="h-11 w-full rounded-xl border p-3 font-normal"
            type="number"
            min={1}
            max={30}
            disabled={inputDisabled}
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
          />
        </label>
      </div>
      <Button
        disabled={
          inputDisabled ||
          !file ||
          (!packId && !newPackTitle?.trim()) ||
          !Number.isInteger(count) ||
          count < 1 ||
          count > 30 ||
          file.size > 30 * 1024 * 1024 ||
          file.size === 0
        }
        onClick={() => void run(generate)}
      >
        {busy && <PillLoader size={24} className="mr-2" />}
        AI로 카드 만들기
      </Button>
      {generation && (
        <>
          <div
            className="rounded-xl bg-accent/50 p-3 text-sm"
            aria-live="polite"
          >
            <p className="font-semibold">
              {pack?.title} · 확인할 카드 {visibleDrafts.length}장
            </p>
            <p className="mt-1 break-all text-muted-foreground">
              원본 자료: {source?.name ?? "이전에 선택한 학습자료"}
            </p>
          </div>
          <p role="status">
            {generation.status === "READY"
              ? "생성이 완료됐어요. 카드를 확인하고 저장해 주세요."
              : generation.status === "FAILED"
                ? "생성을 완료하지 못했어요."
                : "자료에서 카드를 생성하고 있어요. 미리보기부터 확인할 수 있어요."}
          </p>
          {generation.status === "FAILED" && (
            <p role="alert">{generationFailureMessage(generation.errorCode)}</p>
          )}
          {((generation.drafts?.length ?? 0) > 0 ||
            generation.status === "READY") && (
            <>
              {removed.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  {removed.length}장을 제외했어요. 수정 내용을 저장하면 제외
                  상태가 유지됩니다.
                </p>
              )}
              {visibleDrafts.map((draft) => (
                <article
                  key={draft.draftId}
                  className="space-y-2 rounded-xl border p-4"
                >
                  <p className="text-xs font-semibold text-brand">
                    {saved || draft.state !== "EDITABLE"
                      ? "저장된 카드"
                      : "미리보기"}
                  </p>
                  {Object.entries(edits[draft.draftId] ?? draft.card)
                    .filter(
                      ([key, value]) =>
                        key in FLASHCARD_FIELD_LABELS &&
                        typeof value === "string",
                    )
                    .map(([key, value]) => (
                      <label key={key} className="block text-sm">
                        {FLASHCARD_FIELD_LABELS[key]}
                        <textarea
                          disabled={
                            editingDisabled || draft.state !== "EDITABLE"
                          }
                          className="w-full rounded border p-2"
                          value={value}
                          onChange={(e) =>
                            setEdits((prev) => ({
                              ...prev,
                              [draft.draftId]: {
                                ...(prev[draft.draftId] ?? draft.card),
                                [key]: e.target.value,
                              },
                            }))
                          }
                        />
                      </label>
                    ))}
                  {(draft.sourceRefs ?? []).map((ref, i) => (
                    <blockquote
                      key={i}
                      className="border-l-2 pl-3 text-xs text-muted-foreground"
                    >
                      {ref.pageNumber ? `${ref.pageNumber}쪽 · ` : ""}
                      {ref.quote} ·{" "}
                      {ref.sourceVerificationStatus === "UNVERIFIED"
                        ? "원본 확인 필요"
                        : "추출 텍스트 근거"}
                    </blockquote>
                  ))}
                  <button
                    disabled={editingDisabled || draft.state !== "EDITABLE"}
                    className="text-sm text-destructive"
                    onClick={() =>
                      setRemoved((prev) => [...prev, draft.draftId])
                    }
                  >
                    이 카드 제외
                  </button>
                </article>
              ))}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  disabled={
                    editingDisabled ||
                    (!Object.keys(edits).length && !removed.length)
                  }
                  onClick={() => void run(saveDrafts)}
                >
                  수정 내용 저장
                </Button>
                <Button
                  disabled={
                    editingDisabled ||
                    !generation.drafts?.some(
                      (d) =>
                        d.state === "EDITABLE" && !removed.includes(d.draftId),
                    )
                  }
                  onClick={() => void run(save)}
                >
                  카드팩에 저장
                </Button>
              </div>
            </>
          )}
        </>
      )}
      {packId && (
        <Button
          variant="outline"
          disabled={inputDisabled}
          onClick={() =>
            void run(async () => {
              const page = await fetchAPI(
                "/api/flashcards/generations",
                "GET",
                { packId, page: 0, size: 100 },
              );
              if (!page.content.length) {
                setMessage("이 카드팩에는 만들던 카드가 없어요.");
                return;
              }
              setSource(null);
              await refresh(page.content[0].generationId);
              setEdits({});
              setRemoved([]);
              setSaved(false);
              const url = new URL(window.location.href);
              url.searchParams.set("pack", packId);
              url.searchParams.set("generation", page.content[0].generationId);
              window.history.replaceState(null, "", url);
            })
          }
        >
          이전에 만들던 카드 이어보기
        </Button>
      )}
      <a className="block text-brand" href="/flashcards">
        저장된 카드 학습하기
      </a>
    </section>
  );
}
