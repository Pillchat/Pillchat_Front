"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { RotateCcw } from "lucide-react";
import { ApiError, fetchAPI } from "@/lib/client/fetch";
import { LearningCommands } from "@/lib/learning/api";
import {
  reviewAttemptHref,
  reviewModeToAPI,
  type ReviewCollection,
  type ReviewCollectionPage,
} from "@/lib/learning/review";
import { PracticeHeader } from "@/components/molecules";
import { LoadingIndicator } from "@/components/atoms/LoadingIndicator";
import { useAuthIdentity } from "@/hooks/useAuthIdentity";
import { useRouter } from "@/lib/navigation";
import {
  REVIEW_SOURCE_LABELS,
  type ReviewSource,
  type ReviewMode,
} from "@/types/review";
import CategoryCard from "@/app/(questionbank)/questionbank/_components/CategoryCard";
import ActionSheet from "@/app/(questionbank)/questionbank/_components/ActionSheet";

const sources = Object.keys(REVIEW_SOURCE_LABELS) as ReviewSource[];
const errorMessage = (error: unknown) =>
  error instanceof ApiError && error.status === 401
    ? "로그인 후 복습 기록을 확인할 수 있어요."
    : "요청을 완료하지 못했어요. 잠시 후 다시 시도해주세요.";

export default function ServerReviewPage() {
  const userId = useAuthIdentity();
  return <ReviewLibrary key={userId ?? "guest"} />;
}

function ReviewLibrary() {
  const router = useRouter();
  const [source, setSource] = useState<ReviewSource>("CBT");
  const [ready, setReady] = useState(false);
  const [items, setItems] = useState<ReviewCollection[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [selected, setSelected] = useState<ReviewCollection | null>(null);
  const [loadError, setLoadError] = useState("");
  const [startError, setStartError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [retryTitle, setRetryTitle] = useState("");
  const commands = useRef(new LearningCommands());
  const lock = useRef(false);
  const loadLock = useRef(false);
  const requestVersion = useRef(0);
  const active = useRef(true);

  useEffect(() => {
    active.current = true;
    const category = new URLSearchParams(window.location.search).get(
      "category",
    );
    if (sources.includes(category as ReviewSource))
      setSource(category as ReviewSource);
    setReady(true);
    return () => {
      active.current = false;
      requestVersion.current++;
    };
  }, []);

  const load = useCallback(
    async (next?: string) => {
      if (next && loadLock.current) return;
      const version = ++requestVersion.current;
      loadLock.current = true;
      setLoading(true);
      setLoadError("");
      try {
        const page: ReviewCollectionPage = await fetchAPI(
          "/api/learning/review/collections",
          "GET",
          { source, cursor: next, limit: 20 },
        );
        if (!active.current || version !== requestVersion.current) return;
        setItems((previous) =>
          next
            ? [
                ...previous,
                ...page.items.filter(
                  (item) =>
                    !previous.some(
                      (old) => old.collectionRef === item.collectionRef,
                    ),
                ),
              ]
            : page.items,
        );
        setCursor(page.nextCursor);
      } catch (error) {
        if (active.current && version === requestVersion.current)
          setLoadError(errorMessage(error));
      } finally {
        if (active.current && version === requestVersion.current) {
          setLoading(false);
          loadLock.current = false;
        }
      }
    },
    [source],
  );

  useEffect(() => {
    if (!ready) return;
    setItems([]);
    setCursor(null);
    setSelected(null);
    setStartError("");
    void load();
    return () => {
      requestVersion.current++;
    };
  }, [ready, load]);

  const pending = !!commands.current.pending;
  const disabled = busy || pending;
  const changeSource = (next: ReviewSource) => {
    if (disabled || next === source) return;
    requestVersion.current++;
    setItems([]);
    setCursor(null);
    setLoading(true);
    setSelected(null);
    setSource(next);
    const url = new URL(window.location.href);
    url.searchParams.set("category", next);
    url.searchParams.delete("collection");
    window.history.replaceState(null, "", url);
  };
  const start = async (mode?: ReviewMode) => {
    if (lock.current || (!commands.current.pending && (!selected || !mode)))
      return;
    lock.current = true;
    setBusy(true);
    setStartError("");
    if (selected) setRetryTitle(selected.title);
    try {
      const response = commands.current.pending
        ? await commands.current.retry<
            Parameters<typeof reviewAttemptHref>[0]
          >()
        : await commands.current.send<Parameters<typeof reviewAttemptHref>[0]>(
            "/api/learning/review/attempts",
            "POST",
            {
              collectionRef: selected!.collectionRef,
              mode: reviewModeToAPI[mode!],
            },
          );
      if (active.current) router.push(reviewAttemptHref(response));
    } catch (error) {
      if (active.current) setStartError(errorMessage(error));
    } finally {
      lock.current = false;
      if (active.current) setBusy(false);
    }
  };
  const practiceHref =
    source === "CBT"
      ? "/learning/cbt"
      : source === "HANDCRAFTED"
        ? "/questionbank/handcrafted"
        : "/questionbank/premium";

  return (
    <div className="flex min-h-dvh flex-col bg-white">
      <PracticeHeader title="복습하기" backHref="/questionbank" />
      <div className="px-5 pb-5 pt-4">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent">
            <RotateCcw className="h-6 w-6 text-primary" />
          </span>
          <div>
            <h1 className="text-xl font-bold">오답을 모아 다시 학습해요</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              풀었던 문제 모음에서 복습할 문제를 골라보세요.
            </p>
          </div>
        </div>
      </div>
      <div
        className="grid grid-cols-3 border-b px-3"
        role="tablist"
        aria-label="문제 출처"
      >
        {sources.map((item) => (
          <button
            key={item}
            id={`review-tab-${item}`}
            type="button"
            role="tab"
            aria-selected={source === item}
            aria-controls="review-panel"
            disabled={disabled}
            onClick={() => changeSource(item)}
            className={`border-b-2 px-1 py-3 text-sm font-semibold disabled:opacity-50 ${source === item ? "border-primary text-primary" : "border-transparent text-muted-foreground"}`}
          >
            {REVIEW_SOURCE_LABELS[item]}
          </button>
        ))}
      </div>
      <main
        id="review-panel"
        role="tabpanel"
        aria-labelledby={`review-tab-${source}`}
        aria-busy={loading || busy}
        className="flex-1 pb-8"
      >
        <p className="px-6 pb-2 pt-5 text-sm font-semibold text-muted-foreground">
          {source === "CBT" ? "CBT 문제" : REVIEW_SOURCE_LABELS[source]} 모음
        </p>
        {startError && (
          <p
            role="alert"
            className="mx-5 my-3 rounded-xl bg-red-50 p-3 text-sm text-red-700"
          >
            {startError}
          </p>
        )}
        {pending && (
          <div className="mx-5 my-3 rounded-xl bg-amber-50 p-4 text-sm">
            <p>{retryTitle} 복습 시작을 확인하지 못했어요.</p>
            <button
              type="button"
              disabled={busy}
              onClick={() => void start()}
              className="mt-3 font-semibold text-primary disabled:opacity-50"
            >
              다시 시도
            </button>
          </div>
        )}
        {busy && (
          <LoadingIndicator
            label="복습 문제를 준비하는 중..."
            className="py-6 text-center"
          />
        )}
        {items.map((item) => (
          <CategoryCard
            key={item.collectionRef}
            item={{
              title: item.title,
              totalQuestionCount: item.total,
              wrongCount: item.wrong,
            }}
            disabled={disabled || loading}
            onClick={() => setSelected(item)}
          />
        ))}
        {loading && (
          <LoadingIndicator
            label="복습 기록을 불러오는 중..."
            className="py-16 text-center text-sm text-muted-foreground"
          />
        )}
        {loadError && (
          <div className="p-8 text-center">
            <p role="alert" className="text-sm text-muted-foreground">
              {loadError}
            </p>
            <button
              type="button"
              disabled={disabled || loading}
              onClick={() =>
                void load(items.length ? (cursor ?? undefined) : undefined)
              }
              className="mt-4 text-sm font-semibold text-primary"
            >
              다시 불러오기
            </button>
          </div>
        )}
        {!loading && !loadError && !items.length && (
          <div className="px-6 py-14 text-center">
            <RotateCcw className="mx-auto h-9 w-9 text-gray-300" />
            <p className="mt-4 font-semibold">아직 복습할 문제 모음이 없어요</p>
            <p className="mt-2 text-sm text-muted-foreground">
              {REVIEW_SOURCE_LABELS[source]}를 풀면 오답을 여기서 복습할 수
              있어요.
            </p>
            <button
              type="button"
              disabled={disabled}
              onClick={() => router.push(practiceHref)}
              className="mt-6 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white"
            >
              문제 풀러 가기
            </button>
          </div>
        )}
        {cursor && !loadError && !loading && (
          <button
            type="button"
            disabled={disabled}
            onClick={() => void load(cursor)}
            className="mx-auto mt-5 block rounded-xl border px-6 py-3 text-sm font-semibold disabled:opacity-50"
          >
            더 보기
          </button>
        )}
      </main>
      <ActionSheet
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        onSelectMode={(mode) => void start(mode)}
        totalCount={selected?.total ?? 0}
        wrongCount={selected?.wrong ?? 0}
        allowBookmarks={source !== "CBT"}
        bookmarkedCount={selected?.bookmarked ?? 0}
        questionsLoading={disabled}
      />
    </div>
  );
}
