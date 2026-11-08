"use client";

import { useEffect, useRef } from "react";
import { useAuthIdentity } from "@/hooks/useAuthIdentity";
import type { useLearningHistory } from "@/hooks/queries/useLearningHistory";

type Position = { top: number; pages: number; anchor: string; offset: number };
type Query = ReturnType<typeof useLearningHistory>;

function readPosition(key: string): Position | null {
  try {
    const value = JSON.parse(sessionStorage.getItem(key) ?? "null");
    return value &&
      Number.isFinite(value.top) &&
      value.top >= 0 &&
      Number.isSafeInteger(value.pages) &&
      value.pages > 0 &&
      typeof value.anchor === "string" &&
      Number.isFinite(value.offset)
      ? value
      : null;
  } catch {
    return null;
  }
}

export function useLearningHistoryPosition(href: string, query: Query) {
  const user = useAuthIdentity();
  const key = user ? `pillchat:history-position:${user}:${href}` : null;
  const pending = useRef<Position | null>(null);
  useEffect(() => {
    pending.current = key ? readPosition(key) : null;
  }, [key]);
  useEffect(() => {
    const position = pending.current;
    if (!key || !position || !query.data || query.isFetching || query.isError)
      return;
    if (query.data.pages.length < position.pages && query.hasNextPage) {
      void query.fetchNextPage();
      return;
    }
    const frame = requestAnimationFrame(() => {
      const anchor = Array.from(
        document.querySelectorAll("[data-history-attempt]"),
      ).find(
        (element) =>
          element.getAttribute("data-history-attempt") === position.anchor,
      );
      const top = anchor
        ? window.scrollY + anchor.getBoundingClientRect().top - position.offset
        : position.top;
      window.scrollTo({ top, behavior: "instant" });
      pending.current = null;
      try {
        sessionStorage.removeItem(key);
      } catch {}
    });
    return () => cancelAnimationFrame(frame);
  }, [
    key,
    query.data,
    query.isFetching,
    query.isError,
    query.hasNextPage,
    query.fetchNextPage,
  ]);

  return (element: HTMLAnchorElement) => {
    if (!key || !query.data) return;
    const position: Position = {
      top: window.scrollY,
      pages: query.data.pages.length,
      anchor: element.getAttribute("data-history-attempt") ?? "",
      offset: element.getBoundingClientRect().top,
    };
    try {
      sessionStorage.setItem(key, JSON.stringify(position));
    } catch {}
  };
}
