"use client";

import { FC, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useAtomValue } from "jotai";
import { UserRound } from "lucide-react";

import { useRouter } from "@/lib/navigation";
import { unreadCountAtom } from "@/store/notification";

interface AlarmHeaderProps {
  hideBottomBorder?: boolean;
}

export const AlarmHeader: FC<AlarmHeaderProps> = ({
  hideBottomBorder = false,
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const unreadCount = useAtomValue(unreadCountAtom);

  const currentStatus = useMemo(() => {
    const status = searchParams.get("status");
    return status === "pending" || status === "completed" ? status : "pending";
  }, [searchParams]);

  const currentQ = useMemo(() => searchParams.get("q") ?? "", [searchParams]);

  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [isComposing, setIsComposing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (pathname.startsWith("/qna")) {
      setValue(currentQ);
    }
  }, [pathname, currentQ]);

  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
    }
  }, [open]);

  const goQnaWithQuery = (q: string) => {
    const params = new URLSearchParams();
    params.set("status", currentStatus);

    const trimmed = q.trim();
    if (trimmed) {
      params.set("q", trimmed);
    }

    router.push(`/qna?${params.toString()}`);
  };

  const onSubmit = () => {
    if (isComposing) return;

    goQnaWithQuery(value);
  };

  return (
    <>
      <header
        className={`sticky top-0 z-10 flex h-[60px] w-full items-center justify-between border-b-0 bg-white px-6 backdrop-blur ${
          hideBottomBorder ? "" : "border-b border-border/40"
        }`}
      >
        {open ? (
          <div className="flex w-full items-center gap-3">
            <input
              ref={inputRef}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onCompositionStart={() => setIsComposing(true)}
              onCompositionEnd={(e) => {
                setIsComposing(false);
                setValue(e.currentTarget.value);
              }}
              onKeyDown={(e) => {
                if (
                  isComposing ||
                  e.nativeEvent.isComposing ||
                  e.key === "Process" ||
                  e.keyCode === 229
                ) {
                  return;
                }

                if (e.key === "Enter") onSubmit();
                if (e.key === "Escape") setOpen(false);
              }}
              onBlur={() => setOpen(false)}
              placeholder="검색어 입력"
              className="h-10 w-full rounded-md border border-border bg-background px-3 text-label-medium outline-none focus:ring-2 focus:ring-brand/40"
            />
            <button
              type="button"
              className="relative z-30 flex items-center"
              onMouseDown={(e) => e.preventDefault()}
              onClick={onSubmit}
            >
              <img
                src="/icons/search.svg"
                alt="search"
                width={32}
                height={32}
              />
            </button>
          </div>
        ) : (
          <>
            <Link
              href="/"
              className="flex h-[3.625rem] cursor-pointer items-center"
            >
              <img
                src="/brand/PillChat.svg"
                alt="logo"
                width={82}
                height={32}
              />
            </Link>

            <div className="flex items-center gap-4">
              <div
                className="relative flex h-[3.625rem] cursor-pointer items-center"
                onClick={() => router.push("/notifications")}
              >
                <img
                  src="/icons/Bell.svg"
                  alt="notification"
                  width={32}
                  height={32}
                />
                {unreadCount > 0 && (
                  <span className="absolute right-0 top-3 h-2.5 w-2.5 rounded-full border-2 border-white bg-brand" />
                )}
              </div>

              <button
                type="button"
                className="flex h-[3.625rem] items-center text-muted-foreground"
                onClick={() => router.push("/mypage")}
                aria-label="마이페이지"
              >
                <UserRound aria-hidden="true" className="h-7 w-7" />
              </button>
            </div>
          </>
        )}
      </header>
    </>
  );
};
