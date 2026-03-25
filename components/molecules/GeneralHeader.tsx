"use client";

import { FC, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAtomValue } from "jotai";
import { unreadCountAtom } from "@/store/notification";
import { cn } from "@/lib/utils";

interface GeneralHeaderProps {
  currentQ?: string;
  currentStatus?: string;
  searchBasePath?: string;
  hideBottomBorder?: boolean;
  onSearchOpenChange?: (open: boolean) => void;
}

export const GeneralHeader: FC<GeneralHeaderProps> = ({
  currentQ = "",
  currentStatus = "",
  searchBasePath,
  hideBottomBorder = false,
  onSearchOpenChange,
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const unreadCount = useAtomValue(unreadCountAtom);

  const [open, setOpen] = useState(Boolean(currentQ.trim()));
  const [value, setValue] = useState(currentQ.trim());
  const [debouncedValue, setDebouncedValue] = useState(currentQ.trim());
  const inputRef = useRef<HTMLInputElement>(null);

  const resolvedBasePath = useMemo(() => {
    if (searchBasePath) return searchBasePath;
    if (pathname.startsWith("/board")) return "/board";
    return "/qna";
  }, [pathname, searchBasePath]);

  useEffect(() => {
    if (pathname.startsWith("/qna") || pathname.startsWith("/board")) {
      const trimmed = currentQ.trim();
      setValue(trimmed);
      setDebouncedValue(trimmed);
      setOpen(Boolean(trimmed));
    }
  }, [pathname, currentQ]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    onSearchOpenChange?.(open);
  }, [open, onSearchOpenChange]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedValue(value);
    }, 200);

    return () => window.clearTimeout(timer);
  }, [value]);

  useEffect(() => {
    if (!(pathname.startsWith("/qna") || pathname.startsWith("/board"))) return;

    const trimmed = debouncedValue.trim();
    const currentTrimmed = currentQ.trim();

    if (trimmed === currentTrimmed) return;

    const params = new URLSearchParams();

    if (currentStatus) {
      params.set("status", currentStatus);
    }

    if (trimmed) {
      params.set("q", trimmed);
    }

    const queryString = params.toString();
    router.replace(queryString ? `${resolvedBasePath}?${queryString}` : resolvedBasePath);
  }, [
    debouncedValue,
    currentQ,
    currentStatus,
    pathname,
    resolvedBasePath,
    router,
  ]);

  return (
    <header
      className={cn(
        "sticky top-0 z-10 flex w-full items-center justify-between bg-background/95 px-6 py-4 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        !hideBottomBorder && "border-b border-border/40",
      )}
    >
      {open ? (
        <div className="flex w-full items-center gap-3">
          <input
            ref={inputRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape" && !currentQ.trim() && !value.trim()) {
                setOpen(false);
              }
            }}
            onBlur={() => {
              if (!currentQ.trim() && !value.trim()) {
                setOpen(false);
              }
            }}
            placeholder="검색어 입력"
            className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-brand/40"
          />
          <button
            type="button"
            className="relative z-30 flex items-center"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => inputRef.current?.focus()}
          >
            <img src="/search.svg" alt="search" width={32} height={32} />
          </button>
        </div>
      ) : (
        <>
          <Link
            href="/"
            className="flex h-[3.625rem] cursor-pointer items-center"
          >
            <img src="/PillChat.svg" alt="logo" width={82} height={32} />
          </Link>

          <div className="flex items-center gap-4">
            <button
              type="button"
              className="flex h-[3.625rem] items-center"
              onClick={() => setOpen(true)}
            >
              <img src="/search.svg" alt="search" width={32} height={32} />
            </button>

            <div
              className="relative flex h-[3.625rem] cursor-pointer items-center"
              onClick={() => router.push("/notifications")}
            >
              <img src="/Bell.svg" alt="notification" width={32} height={32} />
              {unreadCount > 0 && (
                <span className="absolute right-0 top-3 h-2.5 w-2.5 rounded-full border-2 border-white bg-brand" />
              )}
            </div>
          </div>
        </>
      )}
    </header>
  );
};