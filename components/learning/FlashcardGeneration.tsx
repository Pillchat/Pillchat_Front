"use client";
import { CheckCircle2, CircleAlert, FileUp, FileText } from "lucide-react";
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
  const [packError, setPackError] = useState("");
  const [message, setMessage] = useState("");
  const [edits, setEdits] = useState<Record<string, Card>>({});
  const [removed, setRemoved] = useState<string[]>([]);
  const [source, setSource] = useState<{ name?: string; id?: string } | null>(
    null,
  );
  const [saved, setSaved] = useState(false);
  const [activity, setActivity] = useState<
    "upload" | "request" | "save" | null
  >(null);
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
  const polling = useRef(false);
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
    if (requestRevision === revision.current) {
      setGeneration(next);
      setSource(
        (previous) =>
          previous ?? { id: next.sourceFileId, name: next.sourceFileName },
      );
    }
    // Pack details must not prevent a terminal generation state from being shown.
    void fetchAPI(`/api/flashcard-packs/${next.packId}`, "GET")
      .then((nextPack) => {
        if (requestRevision === revision.current) {
          setPack(nextPack);
          setPackError("");
        }
      })
      .catch((e) => {
        if (requestRevision === revision.current)
          setPackError(
            flashcardErrorMessage(
              e,
              "카드팩 정보를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.",
            ),
          );
      });
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
    const timer = setInterval(async () => {
      if (
        !locked.current &&
        !polling.current &&
        document.visibilityState === "visible" &&
        navigator.onLine
      ) {
        polling.current = true;
        try {
          await refresh(generation.generationId);
        } catch (e) {
          setError(
            flashcardErrorMessage(
              e,
              "진행 상태를 확인하지 못했어요. 진행 상태 새로고침을 눌러 다시 확인해 주세요.",
            ),
          );
        } finally {
          polling.current = false;
        }
      }
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
      setActivity(null);
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
      setActivity("upload");
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
    setActivity("request");
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
    if (!generation) return;
    setActivity("save");
    review.current ??= new FlashcardReview(generation, edits, removed);
    const next = await review.current.finalize();
    if (!next.drafts?.some((draft) => draft.state === "EDITABLE"))
      throw new ApiError(422, { code: "EMPTY_GENERATION" });
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
  const emptyResult =
    generation?.status === "READY" &&
    !saved &&
    !visibleDrafts.length &&
    !removed.length;
  const working = busy || (restoring && !generation) || processing;
  let statusTitle = "AI 카드 생성 중";
  let statusDetail =
    generation?.stage === "PARSE"
      ? "AI가 작성한 카드와 원본 근거를 확인하고 있어요."
      : "자료를 바탕으로 카드를 만들고 있어요. 완료되면 미리보기가 표시됩니다.";
  if (activity === "upload") {
    statusTitle = "자료 업로드 중";
    statusDetail = "선택한 학습자료를 업로드하고 있어요.";
  } else if (activity === "request") {
    statusTitle = "AI 생성 요청 중";
    statusDetail = "자료를 준비하고 AI 생성 작업을 시작하고 있어요.";
  } else if (activity === "save") {
    statusTitle = "카드팩에 저장 중";
    statusDetail =
      "확인한 카드를 저장하고 있어요. 완료될 때까지 기다려 주세요.";
  } else if (restoring && !generation) {
    statusTitle = "이전 작업 확인 중";
    statusDetail = "저장된 생성 상태와 미리보기를 불러오고 있어요.";
  } else if (saved) {
    statusTitle = "카드팩 저장 완료";
    statusDetail = "저장된 카드 목록에서 학습을 시작할 수 있어요.";
  } else if (generation?.status === "FAILED") {
    statusTitle = "카드 생성 실패";
    statusDetail = generationFailureMessage(generation.errorCode);
  } else if (
    generation?.status === "READY" &&
    !visibleDrafts.length &&
    removed.length
  ) {
    statusTitle = "카드를 모두 제외했어요";
    statusDetail = "제외 상태를 유지하려면 ‘수정 내용 저장’을 눌러 주세요.";
  } else if (emptyResult) {
    statusTitle = "저장할 새 카드가 없어요";
    statusDetail =
      "AI 작업은 끝났지만 저장할 카드가 없어요. 자료를 바꾸거나 카드 수를 줄여 다시 생성해 주세요.";
  } else if (generation?.status === "READY") {
    statusTitle = `${visibleDrafts.length}장 생성 완료 · 저장 전`;
    statusDetail =
      "생성이 완료됐어요. 아직 카드팩에 저장되지 않았어요. 아래 카드를 확인하고 ‘카드팩에 저장’을 눌러 주세요.";
  }
  const activeStep = saved
    ? 4
    : activity === "save"
      ? 3
      : generation?.status === "READY"
        ? 2
        : activity === "upload"
          ? 0
          : 1;
  useEffect(() => {
    onBusyChange?.(inputDisabled);
  }, [inputDisabled, onBusyChange]);
  return (
    <section className="space-y-4 rounded-2xl border p-4">
      {(working || generation) && (
        <div
          role="status"
          aria-live="polite"
          aria-busy={working}
          className="space-y-4 rounded-xl border border-gray-300 bg-primary-980 p-4"
        >
          <div className="flex items-start gap-3">
            {working ? (
              <PillLoader size={32} label={statusTitle} />
            ) : generation?.status === "FAILED" || emptyResult ? (
              <CircleAlert
                aria-hidden="true"
                size={32}
                strokeWidth={1.5}
                className="shrink-0 text-primary"
              />
            ) : (
              <CheckCircle2
                aria-hidden="true"
                size={32}
                strokeWidth={1.5}
                className="shrink-0 text-primary"
              />
            )}
            <div className="min-w-0 space-y-1">
              <p className="font-bold text-foreground">{statusTitle}</p>
              <p className="text-sm leading-6 text-muted-foreground">
                {statusDetail}
              </p>
            </div>
          </div>
          <ol
            aria-label="카드 생성 진행 단계"
            className="grid grid-cols-4 gap-2 text-center text-xs"
          >
            {["자료 업로드", "AI 생성", "미리보기 확인", "카드팩 저장"].map(
              (label, index) => (
                <li
                  key={label}
                  aria-current={activeStep === index ? "step" : undefined}
                  className={
                    index <= activeStep
                      ? "rounded-lg bg-white p-2 font-semibold text-primary"
                      : "rounded-lg bg-white/50 p-2 text-muted-foreground"
                  }
                >
                  {index < activeStep ? "✓ " : `${index + 1}. `}
                  {label}
                </li>
              ),
            )}
          </ol>
          {processing && (
            <Button
              type="button"
              variant="outline"
              disabled={busy || restoring}
              onClick={() =>
                void run(async () => {
                  await refresh(generation.generationId);
                })
              }
            >
              진행 상태 새로고침
            </Button>
          )}
        </div>
      )}
      {(error || packError) && (
        <p role="alert" className="text-destructive">
          {error || packError}
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
        {(activity === "upload" || activity === "request" || processing) && (
          <PillLoader size={24} className="mr-2" />
        )}
        {activity === "upload"
          ? "자료 업로드 중"
          : activity === "request" || processing
            ? "AI 생성 중"
            : "AI로 카드 만들기"}
      </Button>
      {generation && (
        <>
          <div
            className="rounded-xl bg-accent/50 p-3 text-sm"
            aria-live="polite"
          >
            <p className="font-semibold">
              {pack?.title} ·{" "}
              {saved
                ? "카드팩 저장 완료"
                : `확인할 카드 ${visibleDrafts.length}장`}
            </p>
            <p className="mt-1 break-all text-muted-foreground">
              원본 자료: {source?.name ?? "이전에 선택한 학습자료"}
            </p>
          </div>
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
                  {activity === "save"
                    ? "카드팩에 저장 중…"
                    : saved
                      ? "저장 완료"
                      : `카드팩에 저장 (${visibleDrafts.length}장)`}
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
