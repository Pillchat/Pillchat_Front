"use client";

import {
  type FormEvent,
  type KeyboardEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { LoaderCircle, RefreshCw, Send } from "lucide-react";
import { useAtomValue } from "jotai";

import { Toast } from "@/components/atoms";
import { AppShell } from "@/components/molecules";
import { fetchAPI, getValidAccessToken } from "@/lib/client/fetch";
import { formatDday } from "@/lib/shared/dday";
import { onlineCountAtom } from "@/store/presence";
import type { CheerMessage, CheerMessagePage } from "@/types/cheer";

type NationalExamPayload = {
  exam?: {
    dDay?: number | null;
  };
};

type StreamStatus = "connecting" | "live" | "reconnecting";

const MESSAGE_PAGE_SIZE = 50;
const MESSAGE_MAX_LENGTH = 300;
const STREAM_RECONNECT_DELAY_MS = 2_000;

const normalizeMessage = (value: unknown): CheerMessage | null => {
  if (!value || typeof value !== "object") return null;

  const item = value as Partial<CheerMessage>;
  const id = Number(item.id);
  if (!Number.isFinite(id) || typeof item.body !== "string") return null;

  return {
    id,
    author: typeof item.author === "string" ? item.author : "익명",
    body: item.body,
    createdAt:
      typeof item.createdAt === "string"
        ? item.createdAt
        : new Date().toISOString(),
    mine: Boolean(item.mine),
  };
};

const normalizeMessagePage = (value: unknown): CheerMessagePage => {
  const root =
    value && typeof value === "object" && "data" in value
      ? (value as { data?: unknown }).data
      : value;
  const page =
    root && typeof root === "object"
      ? (root as {
          messages?: unknown;
          hasNext?: unknown;
          nextCursor?: unknown;
        })
      : {};
  const messages = Array.isArray(page.messages)
    ? page.messages
        .map(normalizeMessage)
        .filter((item): item is CheerMessage => item !== null)
    : [];
  const nextCursor =
    page.nextCursor === null || page.nextCursor === undefined
      ? null
      : Number(page.nextCursor);

  return {
    messages,
    hasNext: Boolean(page.hasNext),
    nextCursor: Number.isFinite(nextCursor) ? nextCursor : null,
  };
};

const mergeMessages = (current: CheerMessage[], incoming: CheerMessage[]) => {
  const messagesById = new Map(current.map((item) => [item.id, item]));

  incoming.forEach((item) => messagesById.set(item.id, item));

  return [...messagesById.values()].sort((left, right) => left.id - right.id);
};

const getLatestMessageId = (messages: CheerMessage[]) =>
  messages.reduce<number | null>(
    (latest, item) => (latest === null ? item.id : Math.max(latest, item.id)),
    null,
  );

const formatMessageTime = (createdAt: string) => {
  const parsed = new Date(createdAt);
  if (!Number.isNaN(parsed.getTime())) {
    return new Intl.DateTimeFormat("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(parsed);
  }

  const time = createdAt.split("T")[1]?.slice(0, 5);
  return time || createdAt;
};

export default function CheerPage() {
  const [messages, setMessages] = useState<CheerMessage[]>([]);
  const [message, setMessage] = useState("");
  const [isComposing, setIsComposing] = useState(false);
  const [isMessagesReady, setIsMessagesReady] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isOlderLoading, setIsOlderLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [hasNext, setHasNext] = useState(false);
  const [nextCursor, setNextCursor] = useState<number | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [streamStatus, setStreamStatus] = useState<StreamStatus>("connecting");
  const [nationalExamDday, setNationalExamDday] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const latestMessageIdRef = useRef<number | null>(null);
  const onlineCount = useAtomValue(onlineCountAtom);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    window.requestAnimationFrame(() => {
      listRef.current?.scrollTo({
        top: listRef.current.scrollHeight,
        behavior,
      });
    });
  }, []);

  const addMessage = useCallback(
    (item: CheerMessage) => {
      latestMessageIdRef.current =
        latestMessageIdRef.current === null
          ? item.id
          : Math.max(latestMessageIdRef.current, item.id);
      setMessages((current) => mergeMessages(current, [item]));
      scrollToBottom();
    },
    [scrollToBottom],
  );

  const loadInitialMessages = useCallback(async () => {
    setIsInitialLoading(true);
    setIsMessagesReady(false);
    setLoadError(null);
    setStreamStatus("connecting");

    try {
      const response = await fetchAPI(
        `/api/cheer/messages?size=${MESSAGE_PAGE_SIZE}`,
        "GET",
      );
      const page = normalizeMessagePage(response);

      setMessages(page.messages);
      setHasNext(page.hasNext);
      setNextCursor(page.nextCursor);
      latestMessageIdRef.current = getLatestMessageId(page.messages);
      setIsMessagesReady(true);
      scrollToBottom("auto");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "응원 메시지를 불러오지 못했습니다.";
      setLoadError(message);
    } finally {
      setIsInitialLoading(false);
    }
  }, [scrollToBottom]);

  const loadOlderMessages = async () => {
    if (!hasNext || nextCursor === null || isOlderLoading) return;

    const list = listRef.current;
    const previousScrollHeight = list?.scrollHeight ?? 0;
    setIsOlderLoading(true);

    try {
      const response = await fetchAPI(
        `/api/cheer/messages?beforeId=${nextCursor}&size=${MESSAGE_PAGE_SIZE}`,
        "GET",
      );
      const page = normalizeMessagePage(response);

      setMessages((current) => mergeMessages(current, page.messages));
      setHasNext(page.hasNext);
      setNextCursor(page.nextCursor);

      window.requestAnimationFrame(() => {
        if (!listRef.current) return;
        listRef.current.scrollTop =
          listRef.current.scrollHeight - previousScrollHeight;
      });
    } catch (error) {
      setToastMessage(
        error instanceof Error
          ? error.message
          : "이전 응원 메시지를 불러오지 못했습니다.",
      );
    } finally {
      setIsOlderLoading(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedMessage = message.trim();
    if (
      !trimmedMessage ||
      trimmedMessage.length > MESSAGE_MAX_LENGTH ||
      isSending
    ) {
      return;
    }

    setIsSending(true);

    try {
      const response = await fetchAPI("/api/cheer/messages", "POST", {
        content: trimmedMessage,
      });
      const createdMessage = normalizeMessage(
        response && typeof response === "object" && "data" in response
          ? (response as { data?: unknown }).data
          : response,
      );

      if (!createdMessage) {
        throw new Error("응원 메시지 응답을 확인하지 못했습니다.");
      }

      addMessage(createdMessage);
      setMessage("");
    } catch (error) {
      setToastMessage(
        error instanceof Error
          ? error.message
          : "응원 메시지를 전송하지 못했습니다. 다시 시도해주세요.",
      );
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && isComposing) {
      event.preventDefault();
    }
  };

  useEffect(() => {
    void loadInitialMessages();
  }, [loadInitialMessages]);

  useEffect(() => {
    if (!isMessagesReady) return;

    let isDisposed = false;
    let eventSource: EventSource | null = null;
    let reconnectTimer: number | null = null;

    const connect = async () => {
      const token = await getValidAccessToken();
      if (isDisposed) return;

      if (!token) {
        setStreamStatus("reconnecting");
        reconnectTimer = window.setTimeout(
          () => void connect(),
          STREAM_RECONNECT_DELAY_MS,
        );
        return;
      }

      const afterId = latestMessageIdRef.current;
      const query = afterId === null ? "" : `?afterId=${afterId}`;
      const source = new EventSource(`/api/cheer/stream${query}`);
      eventSource = source;

      source.onopen = () => {
        if (!isDisposed) setStreamStatus("live");
      };

      source.addEventListener("message", (event) => {
        try {
          const nextMessage = normalizeMessage(JSON.parse(event.data));
          if (nextMessage) addMessage(nextMessage);
        } catch {
          console.warn("Invalid cheer SSE message received.");
        }
      });

      source.onerror = () => {
        source.close();
        if (isDisposed) return;

        setStreamStatus("reconnecting");
        reconnectTimer = window.setTimeout(
          () => void connect(),
          STREAM_RECONNECT_DELAY_MS,
        );
      };
    };

    void connect();

    return () => {
      isDisposed = true;
      eventSource?.close();
      if (reconnectTimer !== null) window.clearTimeout(reconnectTimer);
    };
  }, [addMessage, isMessagesReady]);

  useEffect(() => {
    const controller = new AbortController();

    const fetchNationalExamDday = async () => {
      try {
        const response = await fetch("/api/exams/khp/dday", {
          cache: "no-store",
          signal: controller.signal,
        });
        if (!response.ok) return;

        const payload = (await response.json()) as NationalExamPayload;
        if (typeof payload.exam?.dDay === "number") {
          setNationalExamDday(formatDday(payload.exam.dDay));
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          console.warn("Failed to load the national exam D-Day:", error);
        }
      }
    };

    void fetchNationalExamDday();
    return () => controller.abort();
  }, []);

  const streamLabel =
    streamStatus === "live"
      ? onlineCount === null
        ? "집계 중"
        : onlineCount.toLocaleString("ko-KR")
      : streamStatus === "connecting"
        ? "연결 중"
        : "재연결 중";

  return (
    <AppShell
      bottomSpacing="input"
      className="flex h-dvh flex-col overflow-hidden"
    >
      <header className="sticky top-0 z-10 flex h-[60px] items-center border-b border-border bg-background px-6">
        <div className="flex w-full items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-brand">LIVE 응원방</p>
            <h1 className="mt-1 text-headline-large text-foreground">
              D-Day 응원방
            </h1>
          </div>
          <div className="text-right">
            <span
              className="rounded-full bg-accent px-3 py-1 text-xs font-semibold text-brand"
              aria-live="polite"
            >
              LIVE {streamLabel}
            </span>
            <p className="mt-2 text-xs text-muted-foreground">
              국시 {nationalExamDday ?? "집계 중"}
            </p>
          </div>
        </div>
      </header>

      <main
        ref={listRef}
        className="min-h-0 flex-1 overflow-y-auto px-6 py-5"
        aria-label="응원 메시지"
      >
        {isInitialLoading ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            <LoaderCircle
              aria-hidden="true"
              className="mr-2 h-5 w-5 animate-spin"
            />
            응원 메시지를 불러오는 중입니다.
          </div>
        ) : loadError ? (
          <div className="flex h-full flex-col items-center justify-center px-4 text-center">
            <p className="text-sm text-muted-foreground">{loadError}</p>
            <button
              type="button"
              onClick={() => void loadInitialMessages()}
              className="mt-4 flex items-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground"
            >
              <RefreshCw aria-hidden="true" className="h-4 w-4" />
              다시 시도
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {hasNext && (
              <button
                type="button"
                onClick={() => void loadOlderMessages()}
                disabled={isOlderLoading}
                className="mx-auto flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-xs font-semibold text-brand disabled:opacity-50"
              >
                {isOlderLoading && (
                  <LoaderCircle
                    aria-hidden="true"
                    className="h-4 w-4 animate-spin"
                  />
                )}
                이전 응원 더 보기
              </button>
            )}

            {messages.length === 0 ? (
              <div className="py-16 text-center text-sm text-muted-foreground">
                첫 번째 응원 메시지를 남겨보세요.
              </div>
            ) : (
              messages.map((item) => (
                <div
                  key={item.id}
                  className={`flex ${
                    item.mine ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[78%] rounded-2xl bg-gray-100 px-4 py-3 text-foreground ${
                      item.mine ? "rounded-br-md" : "rounded-bl-md"
                    }`}
                  >
                    <div className="mb-1 flex items-center gap-2 text-[0.6875rem] opacity-75">
                      <span>{item.mine ? "나" : item.author}</span>
                      <time dateTime={item.createdAt}>
                        {formatMessageTime(item.createdAt)}
                      </time>
                    </div>
                    <p className="whitespace-pre-wrap break-words text-sm leading-6">
                      {item.body}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>

      <form
        onSubmit={handleSubmit}
        className="fixed bottom-[calc(6.5rem+env(safe-area-inset-bottom))] left-1/2 z-40 flex w-full max-w-app -translate-x-1/2 gap-2 border-t border-border bg-background px-6 py-3 md:px-8"
      >
        <div className="relative min-w-0 flex-1">
          <input
            value={message}
            maxLength={MESSAGE_MAX_LENGTH}
            onChange={(event) => setMessage(event.target.value)}
            onCompositionStart={() => setIsComposing(true)}
            onCompositionEnd={() => setIsComposing(false)}
            onKeyDown={handleKeyDown}
            aria-label="응원 메시지 입력"
            placeholder="응원의 한마디를 남겨보세요"
            className="h-12 w-full rounded-xl border border-input bg-background px-4 pr-14 text-sm outline-none focus:border-brand"
          />
          <span className="pointer-events-none absolute bottom-2 right-3 text-[0.625rem] text-muted-foreground">
            {message.length}/{MESSAGE_MAX_LENGTH}
          </span>
        </div>
        <button
          type="submit"
          aria-label="응원 메시지 전송"
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground active:scale-95 disabled:opacity-50"
          disabled={!message.trim() || isSending}
        >
          {isSending ? (
            <LoaderCircle aria-hidden="true" className="h-6 w-6 animate-spin" />
          ) : (
            <Send aria-hidden="true" className="h-8 w-8" strokeWidth={1.5} />
          )}
        </button>
      </form>

      <Toast
        open={Boolean(toastMessage)}
        message={toastMessage ?? ""}
        onClose={() => setToastMessage(null)}
      />
    </AppShell>
  );
}
