"use client";

import { useMemo, useState } from "react";

type TabKey = "best" | "latest" | "study" | "column" | "promo";
type Tab = { key: TabKey; label: string };

type Props = {
  value?: TabKey;
  defaultValue?: TabKey;
  onChange?: (key: TabKey) => void;
  tabs?: Tab[];
  className?: string;
};

const DEFAULT_TABS: Tab[] = [
  { key: "best", label: "BEST 게시글" },
  { key: "latest", label: "최신글" },
  { key: "study", label: "학습자료" },
  { key: "column", label: "칼럼" },
  { key: "promo", label: "홍보게시판" },
];

export const ArrayList = ({
  value,
  defaultValue = "best",
  onChange,
  tabs = DEFAULT_TABS,
  className = "",
}: Props) => {
  const isControlled = value !== undefined;
  const [internal, setInternal] = useState<TabKey>(defaultValue);
  const selected = (isControlled ? value : internal) ?? defaultValue;

  const items = useMemo(() => tabs.slice(0, 5), [tabs]);

  const select = (key: TabKey) => {
    if (!isControlled) setInternal(key);
    onChange?.(key);
  };

  return (
    <div
      className={["relative h-[34px] w-full bg-transparent", className].join(
        " ",
      )}
    >
      <div className="h-full pl-6">
        <div className="h-full overflow-x-auto overflow-y-hidden [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex h-full w-max min-w-[437px] items-center gap-5">
            {items.map((t) => {
              const active = selected === t.key;

              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => select(t.key)}
                  className={[
                    "relative inline-flex h-full items-start whitespace-nowrap px-0",
                    "font-['Pretendard'] text-[18px] font-semibold",
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
