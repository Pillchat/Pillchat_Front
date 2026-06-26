"use client";

import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";

import { AppShell } from "@/components/molecules";
import {
  calculateDday,
  formatDday,
  getNextJanuaryFourthFridayDate,
} from "@/lib/shared/dday";

type CheerMessage = {
  id: number;
  author: string;
  body: string;
  createdAt: string;
  mine?: boolean;
};

const initialMessages: CheerMessage[] = [
  {
    id: 1,
    author: "익명_약대생104",
    body: "오늘도 한 페이지라도 보면 성공이에요.",
    createdAt: "09:12",
  },
  {
    id: 2,
    author: "익명_약대생218",
    body: "다들 국시까지 같이 버텨봐요!",
    createdAt: "09:14",
  },
  {
    id: 3,
    author: "익명_약대생037",
    body: "약물학 회독 시작합니다.",
    createdAt: "09:16",
  },
];

function formatTime(date: Date) {
  return `${String(date.getHours()).padStart(2, "0")}:${String(
    date.getMinutes(),
  ).padStart(2, "0")}`;
}

export default function CheerPage() {
  const [messages, setMessages] = useState(initialMessages);
  const [message, setMessage] = useState("");
  const [isComposing, setIsComposing] = useState(false);
  const listRef = useRef<HTMLDivElement | null>(null);
  const nationalExamDday = formatDday(
    calculateDday(getNextJanuaryFourthFridayDate()),
  );

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedMessage = message.trim();
    if (!trimmedMessage) return;

    setMessages((current) => [
      ...current,
      {
        id: Date.now(),
        author: "나",
        body: trimmedMessage,
        createdAt: formatTime(new Date()),
        mine: true,
      },
    ]);
    setMessage("");
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && isComposing) {
      event.preventDefault();
    }
  };

  useEffect(() => {
    listRef.current?.scrollTo({
      top: listRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  return (
    <AppShell bottomSpacing="input" className="flex flex-col">
      <header className="sticky top-0 z-10 border-b border-border bg-background px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-brand">LIVE 응원방</p>
            <h1 className="mt-1 text-xl font-bold text-foreground">
              D-Day 응원방
            </h1>
          </div>
          <div className="text-right">
            <span className="rounded-full bg-accent px-3 py-1 text-xs font-semibold text-brand">
              LIVE 128
            </span>
            <p className="mt-2 text-xs text-muted-foreground">
              국시 {nationalExamDday}
            </p>
          </div>
        </div>
      </header>

      <main
        ref={listRef}
        className="flex-1 overflow-y-auto px-6 py-5"
        aria-label="응원 메시지"
      >
        <div className="flex flex-col gap-4">
          {messages.map((item) => (
            <div
              key={item.id}
              className={`flex ${item.mine ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[78%] rounded-2xl px-4 py-3 ${
                  item.mine
                    ? "rounded-br-md bg-primary text-primary-foreground"
                    : "rounded-bl-md bg-secondary text-foreground"
                }`}
              >
                <div className="mb-1 flex items-center gap-2 text-[0.6875rem] opacity-75">
                  <span>{item.author}</span>
                  <time>{item.createdAt}</time>
                </div>
                <p className="text-sm leading-6">{item.body}</p>
              </div>
            </div>
          ))}
        </div>
      </main>

      <form
        onSubmit={handleSubmit}
        className="fixed bottom-[calc(5.75rem+env(safe-area-inset-bottom))] left-1/2 z-40 flex w-full max-w-[480px] -translate-x-1/2 gap-4 border-t border-border bg-background px-6 py-3"
      >
        <input
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          onCompositionStart={() => setIsComposing(true)}
          onCompositionEnd={() => setIsComposing(false)}
          onKeyDown={handleKeyDown}
          aria-label="응원 메시지 입력"
          placeholder="응원의 한마디를 남겨보세요"
          className="h-12 min-w-0 flex-1 rounded-xl border border-input bg-background px-4 text-sm outline-none focus:border-brand"
        />
        <button
          type="submit"
          aria-label="응원 메시지 전송"
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground active:scale-95 disabled:opacity-50"
          disabled={!message.trim()}
        >
          <Send aria-hidden="true" className="h-8 w-8" strokeWidth={1.5} />
        </button>
      </form>
    </AppShell>
  );
}
