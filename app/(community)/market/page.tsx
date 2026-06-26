"use client";

import Link from "next/link";
import { Plus, Star } from "lucide-react";
import { useMemo, useState } from "react";

import { AppShell, MeaninglessHeader } from "@/components/molecules";
import { MARKET_ITEMS, MARKET_SUBJECTS, MARKET_YEARS } from "@/lib/market/mock";

export default function MarketPage() {
  const [selectedSubject, setSelectedSubject] = useState("전체");
  const [selectedYear, setSelectedYear] = useState("전체");

  const filteredMaterials = useMemo(() => {
    return MARKET_ITEMS.filter(
      (item) =>
        (selectedSubject === "전체" || item.subject === selectedSubject) &&
        (selectedYear === "전체" || item.year === selectedYear),
    );
  }, [selectedSubject, selectedYear]);

  const renderChips = (
    items: readonly string[],
    value: string,
    onChange: (next: string) => void,
  ) => (
    <div className="flex gap-1.5 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {items.map((item) => (
        <button
          key={item}
          type="button"
          aria-pressed={value === item}
          onClick={() => onChange(item)}
          className={`h-8 shrink-0 rounded-full px-3 text-label-medium transition-colors ${
            value === item
              ? "bg-primary text-primary-foreground"
              : "bg-primary-980 text-muted-foreground"
          }`}
        >
          {item}
        </button>
      ))}
    </div>
  );

  return (
    <AppShell>
      <MeaninglessHeader />

      <main className="pb-8 pt-3">
        <section className="px-6">
          <p className="text-label-medium text-brand">Market</p>
          <h1 className="mt-2 text-headline-large text-foreground">
            필요한 학습자료를
            <br />
            과목과 학년별로 찾아보세요
          </h1>
        </section>

        <section
          className="sticky top-0 z-10 mt-6 space-y-2 bg-background/95 px-6 py-3 backdrop-blur"
          aria-label="자료 필터"
        >
          {renderChips(MARKET_SUBJECTS, selectedSubject, setSelectedSubject)}
          {renderChips(MARKET_YEARS, selectedYear, setSelectedYear)}
        </section>

        <div className="mt-4 flex items-center justify-between px-6">
          <h2 className="text-title-large text-foreground">
            {selectedSubject === "전체" ? selectedYear : selectedSubject} 자료
          </h2>
          <span className="text-body-medium text-muted-foreground">
            {filteredMaterials.length}개
          </span>
        </div>

        <section
          className="mt-4 grid grid-cols-2 gap-4 px-6"
          aria-label="자료 목록"
        >
          {filteredMaterials.length === 0 ? (
            <div className="col-span-2 rounded-lg border border-dashed border-border px-4 py-10 text-center">
              <p className="text-title-small text-foreground">
                아직 등록된 자료가 없습니다.
              </p>
              <p className="mt-2 text-body-small text-muted-foreground">
                다른 학년을 선택하거나 첫 자료를 등록해보세요.
              </p>
            </div>
          ) : (
            filteredMaterials.map((item) => (
              <Link
                key={item.id}
                href={`/market/${item.id}`}
                className="overflow-hidden rounded-lg border border-border bg-card active:scale-[0.98]"
              >
                <span className="relative flex h-24 items-center justify-center bg-primary-980 text-headline-large">
                  {item.icon}
                  <span className="absolute right-2 top-2 rounded-full bg-card/95 px-2 py-0.5 text-label-small font-medium text-primary">
                    {item.price === 0
                      ? "무료"
                      : `${item.price.toLocaleString("ko-KR")}원`}
                  </span>
                </span>
                <span className="block px-3 py-3">
                  <span className="text-label-small font-medium text-brand">
                    {item.subject} · {item.year}
                  </span>
                  <strong className="mt-1 line-clamp-2 block min-h-10 text-label-medium text-foreground">
                    {item.title}
                  </strong>
                  <span className="mt-2 flex items-center justify-between text-label-small text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Star
                        aria-hidden="true"
                        className="h-3.5 w-3.5 fill-brand text-brand"
                        strokeWidth={1.5}
                      />
                      {item.rating}
                    </span>
                    <span>{item.purchaseCount}회 구매</span>
                  </span>
                  <span className="mt-1 block truncate text-label-small font-medium text-muted-foreground">
                    by @{item.author}
                  </span>
                </span>
              </Link>
            ))
          )}
        </section>
      </main>

      <div className="pointer-events-none fixed bottom-[calc(6.75rem+env(safe-area-inset-bottom))] left-1/2 z-40 flex w-full max-w-[480px] -translate-x-1/2 justify-end px-6">
        <Link
          href="/market/upload"
          aria-label="자료 등록"
          className="pointer-events-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg active:scale-95"
        >
          <Plus aria-hidden="true" className="h-8 w-8" strokeWidth={1.5} />
        </Link>
      </div>
    </AppShell>
  );
}
