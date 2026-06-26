"use client";

import Link from "next/link";
import { Plus, Star } from "lucide-react";
import { useMemo, useState } from "react";

import { AppShell, MeaninglessHeader } from "@/components/molecules";
import { useMaterialsQuery } from "@/hooks/queries";
import { MARKET_SUBJECTS, MARKET_YEARS } from "@/lib/market/options";

const ALL_FILTER = "전체";

const getMaterialList = (data: any) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.content)) return data.content;
  if (Array.isArray(data?.data?.content)) return data.data.content;
  return [];
};

const getSubjectText = (item: any) =>
  String(item?.subjectName ?? item?.subject?.name ?? item?.category ?? "");

const getYearText = (item: any) =>
  String(item?.year ?? item?.grade ?? item?.schoolYear ?? "");

const getPrice = (item: any) => Number(item?.price ?? item?.amount ?? 0);

export default function MarketPage() {
  const [selectedSubject, setSelectedSubject] = useState(ALL_FILTER);
  const [selectedYear, setSelectedYear] = useState(ALL_FILTER);
  const { data, isLoading, isError, refetch } = useMaterialsQuery();

  const materials = useMemo(() => getMaterialList(data), [data]);

  const filteredMaterials = useMemo(() => {
    return materials.filter(
      (item) =>
        (selectedSubject === ALL_FILTER ||
          getSubjectText(item) === selectedSubject) &&
        (selectedYear === ALL_FILTER || getYearText(item) === selectedYear),
    );
  }, [materials, selectedSubject, selectedYear]);

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
            {selectedSubject === ALL_FILTER ? selectedYear : selectedSubject}{" "}
            자료
          </h2>
          <span className="text-body-medium text-muted-foreground">
            {filteredMaterials.length}개
          </span>
        </div>

        <section
          className="mt-4 grid grid-cols-2 gap-4 px-6"
          aria-label="자료 목록"
        >
          {isLoading ? (
            [...Array(4)].map((_, index) => (
              <div
                key={index}
                className="h-48 animate-pulse rounded-lg bg-primary-980"
              />
            ))
          ) : isError ? (
            <div className="col-span-2 rounded-lg border border-dashed border-border px-4 py-10 text-center">
              <p className="text-title-small text-foreground">
                자료를 불러오지 못했습니다.
              </p>
              <button
                type="button"
                onClick={() => void refetch()}
                className="mt-3 text-label-medium text-primary"
              >
                다시 시도
              </button>
            </div>
          ) : filteredMaterials.length === 0 ? (
            <div className="col-span-2 rounded-lg border border-dashed border-border px-4 py-10 text-center">
              <p className="text-title-small text-foreground">
                아직 등록된 자료가 없습니다.
              </p>
              <p className="mt-2 text-body-small text-muted-foreground">
                다른 학년을 선택하거나 첫 자료를 등록해보세요.
              </p>
            </div>
          ) : (
            filteredMaterials.map((item: any) => {
              const price = getPrice(item);
              const rating = item?.rating ?? item?.averageRating;
              const purchaseCount = item?.purchaseCount ?? item?.buyCount;
              const author =
                item?.author ?? item?.nickname ?? item?.userNickname ?? "";
              const subject = getSubjectText(item);
              const year = getYearText(item);

              return (
                <Link
                  key={item.id}
                  href={`/materials/${item.id}`}
                  className="overflow-hidden rounded-lg border border-border bg-card active:scale-[0.98]"
                >
                  <span className="relative flex h-24 items-center justify-center bg-primary-980 px-3 text-center text-title-small text-primary">
                    자료
                    <span className="absolute right-2 top-2 rounded-full bg-card/95 px-2 py-0.5 text-label-small font-medium text-primary">
                      {price > 0
                        ? `${price.toLocaleString("ko-KR")}원`
                        : "무료"}
                    </span>
                  </span>
                  <span className="block px-3 py-3">
                    <span className="text-label-small font-medium text-brand">
                      {[subject, year].filter(Boolean).join(" · ") ||
                        "학습자료"}
                    </span>
                    <strong className="mt-1 line-clamp-2 block min-h-10 text-label-medium text-foreground">
                      {item?.title ?? "제목 없음"}
                    </strong>
                    {(rating || purchaseCount) && (
                      <span className="mt-2 flex items-center justify-between text-label-small text-muted-foreground">
                        {rating ? (
                          <span className="flex items-center gap-1">
                            <Star
                              aria-hidden="true"
                              className="h-3.5 w-3.5 fill-brand text-brand"
                              strokeWidth={1.5}
                            />
                            {rating}
                          </span>
                        ) : (
                          <span />
                        )}
                        {purchaseCount ? (
                          <span>{purchaseCount}회 구매</span>
                        ) : null}
                      </span>
                    )}
                    {author && (
                      <span className="mt-1 block truncate text-label-small font-medium text-muted-foreground">
                        by @{author}
                      </span>
                    )}
                  </span>
                </Link>
              );
            })
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
