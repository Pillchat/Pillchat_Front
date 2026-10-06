"use client";
import { PillLoader } from "@/components/atoms/PillLoader";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  ApiError,
  fetchAPI,
  getValidAccessToken,
  recoverAccessToken,
} from "@/lib/client/fetch";
import { LearningCommands } from "@/lib/learning/api";

type Card = { type: string; [key: string]: string };
type Draft = {
  draftId: string;
  version: number;
  state: string;
  card: Card;
  sourceRefs: {
    quote: string;
    pageNumber?: number;
    sourceVerificationStatus: string;
  }[];
};
type Generation = {
  generationId: string;
  packId: string;
  status: string;
  stage: string;
  version: number;
  errorCode?: string;
  failedUnitOrdinal?: number;
  drafts?: Draft[];
};
type Pack = {
  packId: string;
  title: string;
  version: number;
  cardCount: number;
};
export default function FlashcardGeneration({
  title,
  onBusyChange,
}: {
  title: string;
  onBusyChange?: (busy: boolean) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [pack, setPack] = useState<Pack | null>(null);
  const [packs, setPacks] = useState<Pack[]>([]);
  const [generation, setGeneration] = useState<Generation | null>(null);
  const [count, setCount] = useState(5);
  const [cardType, setCardType] = useState("CONCEPT");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [edits, setEdits] = useState<Record<string, Card>>({});
  const [removed, setRemoved] = useState<string[]>([]);
  const workflow = useRef<{
    file: File;
    title: string;
    uploadKey: string;
    sourceId?: string;
    pack?: Pack;
  } | null>(null);
  const commands = useRef(new LearningCommands());
  const pendingAction = useRef<(() => Promise<void>) | null>(null);
  const locked = useRef(false);
  const revision = useRef(0);
  const refresh = async (id: string) => {
    const requestRevision = revision.current;
    const next: Generation = await fetchAPI(
      `/api/flashcards/generations/${encodeURIComponent(id)}`,
      "GET",
    );
    const nextPack = await fetchAPI(
      `/api/flashcard-packs/${next.packId}`,
      "GET",
    );
    if (requestRevision === revision.current) {
      setGeneration(next);
      setPack(nextPack);
    }
    return next;
  };
  const listPacks = async () => {
    const all: Pack[] = [];
    for (let page = 0; ; page++) {
      const response = await fetchAPI("/api/flashcard-packs", "GET", {
        page,
        size: 100,
      });
      all.push(...response.items);
      if (!response.hasNext) break;
    }
    setPacks(all);
  };
  useEffect(() => {
    void listPacks().catch((e) => setError(e.message));
    const id = new URLSearchParams(window.location.search).get("generation");
    if (id) void refresh(id).catch((e) => setError(e.message));
  }, []);
  useEffect(() => {
    if (!generation || ["READY", "FAILED"].includes(generation.status)) return;
    const timer = setInterval(() => {
      if (
        !locked.current &&
        document.visibilityState === "visible" &&
        navigator.onLine
      )
        void refresh(generation.generationId).catch((e) => setError(e.message));
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
      setError(e instanceof Error ? e.message : "요청에 실패했습니다.");
      if (!(e instanceof ApiError) || e.status >= 500)
        pendingAction.current = action;
      else {
        pendingAction.current = null;
        if (e.status === 409 && generation)
          await refresh(generation.generationId).catch(() => undefined);
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
    if (!file || !title.trim()) return;
    if (!workflow.current)
      workflow.current = {
        file,
        title: title.trim(),
        uploadKey: crypto.randomUUID(),
      };
    const flow = workflow.current;
    if (!flow.sourceId) {
      const form = new FormData();
      form.append("file", flow.file);
      form.append(
        "metadata",
        new Blob([JSON.stringify({ idempotencyKey: flow.uploadKey })], {
          type: "application/json",
        }),
      );
      const upload = (token: string | null) =>
        fetch("/api/flashcards/sources", {
          method: "POST",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: form,
        });
      const token = await getValidAccessToken();
      let response = await upload(token);
      if (response.status === 401) {
        const next = await recoverAccessToken(token);
        if (next) response = await upload(next);
      }
      const data = await response.json();
      if (!response.ok) throw new ApiError(response.status, data);
      flow.sourceId = data.sourceFileId;
    }
    if (!flow.pack)
      flow.pack = await send<Pack>("/api/flashcard-packs", {
        title: flow.title,
        sourceFileId: flow.sourceId,
        groupKind: "UNCLASSIFIED",
      });
    setPack(flow.pack);
    const next = await send<Generation>(
      `/api/flashcard-packs/${flow.pack.packId}/generations`,
      { expectedVersion: flow.pack.version, cardType, count },
    );
    setGeneration(next);
    setEdits({});
    setRemoved([]);
    workflow.current = null;
    const url = new URL(window.location.href);
    url.searchParams.set("generation", next.generationId);
    window.history.replaceState(null, "", url);
    await listPacks().catch((e) => setError(e.message));
  };
  const save = async () => {
    if (!generation || !pack) return;
    const items = (generation.drafts ?? [])
      .filter((d) => d.state === "EDITABLE" && !removed.includes(d.draftId))
      .map((d) => ({
        clientItemId: d.draftId,
        draftId: d.draftId,
        expectedVersion: d.version,
        card: edits[d.draftId] ?? d.card,
      }));
    if (!items.length) return;
    await send(`/api/flashcard-packs/${pack.packId}/cards/batch`, {
      expectedVersion: pack.version,
      items,
    });
    await refresh(generation.generationId).catch((e) => setError(e.message));
    await listPacks().catch((e) => setError(e.message));
    setMessage("카드를 저장했습니다. 카드 목록에서 학습할 수 있습니다.");
  };
  const saveDrafts = async () => {
    if (!generation) return;
    const next = await send<Generation>(
      `/api/flashcards/generations/${generation.generationId}/drafts`,
      {
        expectedVersion: generation.version,
        updates: Object.entries(edits)
          .filter(([id]) => !removed.includes(id))
          .map(([draftId, card]) => ({ draftId, card })),
        removedDraftIds: removed,
      },
      "PATCH",
    );
    setGeneration(next);
    setEdits({});
    setRemoved([]);
    setMessage("초안 변경을 저장했습니다.");
  };
  const disabled = busy || !!pendingAction.current;
  useEffect(() => {
    onBusyChange?.(disabled);
  }, [disabled, onBusyChange]);
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
          같은 요청 다시 시도
        </Button>
      )}
      <p className="text-sm text-muted-foreground">
        파일에서 카드를 생성하고, 초안을 검토한 후 저장하세요.
      </p>
      <input
        aria-label="카드 원본 파일"
        type="file"
        accept=".pdf,.png,.jpg,.jpeg,.txt,.md,.csv"
        disabled={disabled}
        onChange={(e) => {
          setFile(e.target.files?.[0] ?? null);
          workflow.current = null;
        }}
      />
      <div className="flex gap-3">
        <select
          aria-label="카드 유형"
          value={cardType}
          disabled={disabled}
          onChange={(e) => setCardType(e.target.value)}
        >
          {["CONCEPT", "RELATION", "COMPARE"].map((t, i) => (
            <option key={t} value={t}>
              {["개념", "인과", "비교"][i]}
            </option>
          ))}
        </select>
        <input
          aria-label="카드 수"
          className="w-20 rounded border p-2"
          type="number"
          min={1}
          max={30}
          disabled={disabled}
          value={count}
          onChange={(e) => setCount(Number(e.target.value))}
        />
      </div>
      <Button
        disabled={
          disabled ||
          !file ||
          !title.trim() ||
          !Number.isInteger(count) ||
          count < 1 ||
          count > 30 ||
          file.size > 30 * 1024 * 1024 ||
          file.size === 0
        }
        onClick={() => void run(generate)}
      >
        {busy && <PillLoader size={24} className="mr-2" />}
        파일로 카드 생성
      </Button>
      {generation && (
        <>
          <p>
            생성 상태: {generation.status} · {generation.stage}
          </p>
          {generation.status === "FAILED" && (
            <p role="alert">
              생성에 실패했습니다: {generation.errorCode}{" "}
              {generation.failedUnitOrdinal
                ? `(원본 ${generation.failedUnitOrdinal}번)`
                : ""}
            </p>
          )}
          {generation.status === "READY" && (
            <>
              {(generation.drafts ?? [])
                .filter(
                  (d) => d.state === "EDITABLE" && !removed.includes(d.draftId),
                )
                .map((draft) => (
                  <article
                    key={draft.draftId}
                    className="space-y-2 rounded-xl border p-4"
                  >
                    {Object.entries(edits[draft.draftId] ?? draft.card)
                      .filter(([key]) => key !== "type")
                      .map(([key, value]) => (
                        <label key={key} className="block text-sm">
                          {(
                            {
                              term: "용어",
                              definition: "설명",
                              triggerText: "원인",
                              effect: "결과",
                              mechanism: "기전",
                              nameA: "비교 대상 A",
                              nameB: "비교 대상 B",
                              common: "공통점",
                              difference: "차이점",
                            } as Record<string, string>
                          )[key] ?? key}
                          <textarea
                            disabled={disabled}
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
                    {draft.sourceRefs.map((ref, i) => (
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
                      disabled={disabled}
                      className="text-sm text-destructive"
                      onClick={() =>
                        setRemoved((prev) => [...prev, draft.draftId])
                      }
                    >
                      초안 제외
                    </button>
                  </article>
                ))}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  disabled={disabled}
                  onClick={() => void run(saveDrafts)}
                >
                  초안 변경 저장
                </Button>
                <Button
                  disabled={
                    disabled ||
                    !generation.drafts?.some(
                      (d) =>
                        d.state === "EDITABLE" && !removed.includes(d.draftId),
                    )
                  }
                  onClick={() => void run(save)}
                >
                  검토한 카드 저장
                </Button>
              </div>
            </>
          )}
        </>
      )}
      <details>
        <summary>저장된 팩과 생성 작업 복구</summary>
        {packs.map((p) => (
          <button
            key={p.packId}
            disabled={disabled}
            className="block w-full border-b p-3 text-left"
            onClick={() =>
              void run(async () => {
                const page = await fetchAPI(
                  "/api/flashcards/generations",
                  "GET",
                  { packId: p.packId, page: 0, size: 100 },
                );
                if (!page.content.length) {
                  setMessage("이 팩에는 생성 작업이 없습니다.");
                  return;
                }
                await refresh(page.content[0].generationId);
                setEdits({});
                setRemoved([]);
                const url = new URL(window.location.href);
                url.searchParams.set(
                  "generation",
                  page.content[0].generationId,
                );
                window.history.replaceState(null, "", url);
              })
            }
          >
            {p.title} · {p.cardCount}장
          </button>
        ))}
      </details>
      <a className="block text-brand" href="/flashcards">
        저장된 카드 학습하기
      </a>
    </section>
  );
}
