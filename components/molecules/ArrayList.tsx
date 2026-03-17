"use client";

import { useMemo, useState } from "react";

type TabKey = string;
type Tab<T extends string = string> = { key: T; label: string };

type Props<T extends string = string> = {
  value?: T;
  defaultValue?: T;
  onChange?: (key: T) => void;
  tabs?: Tab<T>[];
  className?: string;
  scrollable?: boolean;
};

const DEFAULT_TABS = [
  { key: "best", label: "BEST 게시글" },
  { key: "latest", label: "최신글" },
  { key: "study", label: "학습자료" },
  { key: "column", label: "칼럼" },
  { key: "promo", label: "홍보게시판" },
] as const;

export const ArrayList = <T extends string>({
  value,
  defaultValue,
  onChange,
  tabs = DEFAULT_TABS as unknown as Tab<T>[],
  className = "",
  scrollable = true,
}: Props<T>) => {
  const fallback = tabs[0]?.key;
  const isControlled = value !== undefined;
  const [internal, setInternal] = useState<T | undefined>(
    defaultValue ?? fallback,
  );
  const selected =
    (isControlled ? value : internal) ?? defaultValue ?? fallback;

  const items = useMemo(() => tabs.slice(0, 5), [tabs]);

  const select = (key: T) => {
    if (!isControlled) setInternal(key);
    onChange?.(key);
  };

  return (
    <div
      className={["relative h-[34px] w-full bg-transparent", className].join(
        " ",
      )}
    >
      <div className={scrollable ? "h-full px-6" : "h-full px-6"}>
        <div
          className={[
            "h-full overflow-y-hidden [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
            scrollable ? "overflow-x-auto" : "overflow-x-hidden",
          ].join(" ")}
        >
          <div
            className={
              scrollable
                ? "flex h-full w-max min-w-[437px] items-center gap-5"
                : "grid h-full w-full"
            }
            style={
              scrollable
                ? undefined
                : {
                    gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))`,
                  }
            }
          >
            {items.map((t) => {
              const active = selected === t.key;

              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => select(t.key)}
                  className={[
                    "relative inline-flex h-full whitespace-nowrap px-0",
                    "font-['Pretendard'] text-[18px] font-semibold",
                    scrollable
                      ? "items-start"
                      : "items-start justify-center text-center",
                    active ? "text-primary" : "text-gray-600",
                    "after:absolute after:bottom-0 after:left-0 after:w-full after:content-['']",
                    active
                      ? "after:h-[2px] after:bg-primary"
                      : "after:h-px after:bg-gray-200",
                  ].join(" ")}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-px bg-gray-200" />
    </div>
  );
};
