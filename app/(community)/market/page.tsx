"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Bookmark, Heart, Plus, Star } from "lucide-react";
import { Suspense, useEffect, useMemo, useState } from "react";

import { AppShell, MeaninglessHeader } from "@/components/molecules";
import {
  useMarketItemsQuery,
  useSellerMarketItemsQuery,
  useSubjectsQuery,
} from "@/hooks/queries";
import type { MarketGrade, MarketItemCard } from "@/types/market";

const PAGE_SIZE = 20;

const gradeOptions: Array<{ value: MarketGrade | ""; label: string }> = [
  { value: "", label: "전체" },
  { value: "GRADE_1", label: "1학년" },
  { value: "GRADE_2", label: "2학년" },
  { value: "GRADE_3", label: "3학년" },
  { value: "GRADE_4", label: "4학년" },
  { value: "GRADE_5", label: "5학년" },
  { value: "GRADE_6", label: "6학년" },
];

const gradeLabel = (grade: MarketGrade) =>
  gradeOptions.find((item) => item.value === grade)?.label ?? grade;

const getSubjectOptions = (
  response: ReturnType<typeof useSubjectsQuery>["data"],
  items: MarketItemCard[],
) => {
  const apiOptions = (response?.sections ?? []).flatMap((section) =>
    section.items.flatMap((item) => {
      const id = Number(item.id ?? item.subjectId ?? item.value);
      return Number.isFinite(id) ? [{ id, label: item.label }] : [];
    }),
  );
  const itemOptions = items.map((item) => ({
    id: item.subjectId,
    label: item.subjectName,
  }));

  return Array.from(
    new Map(
      [...apiOptions, ...itemOptions].map((item) => [item.id, item]),
    ).values(),
  );
};

function MarketPageContent() {
  const searchParams = useSearchParams();
  const sellerId = searchParams.get("sellerId");
  const [selectedSubjectId, setSelectedSubjectId] = useState<number>();
  const [selectedGrade, setSelectedGrade] = useState<MarketGrade | "">("");
  const [page, setPage] = useState(0);

  useEffect(() => {
    setPage(0);
  }, [sellerId]);

  const listParams = useMemo(
    () => ({
      page,
      size: PAGE_SIZE,
      sort: ["createdAt,desc"],
      subjectId: selectedSubjectId,
      grade: selectedGrade || undefined,
    }),
    [page, selectedGrade, selectedSubjectId],
  );
  const sellerParams = useMemo(
    () => ({ page, size: PAGE_SIZE, sort: ["createdAt,desc"] }),
    [page],
  );

  const listQuery = useMarketItemsQuery(listParams, { enabled: !sellerId });
  const sellerQuery = useSellerMarketItemsQuery(sellerId, sellerParams, {
    enabled: Boolean(sellerId),
  });
  const subjectsQuery = useSubjectsQuery();
  const activeQuery = sellerId ? sellerQuery : listQuery;
  const marketPage = activeQuery.data;
  const items = marketPage?.content ?? [];
  const subjectOptions = useMemo(
    () => getSubjectOptions(subjectsQuery.data, items),
    [items, subjectsQuery.data],
  );
  const sellerNickname = items[0]?.sellerNickname;

  const changeSubject = (subjectId?: number) => {
    setSelectedSubjectId(subjectId);
    setPage(0);
  };

  const changeGrade = (grade: MarketGrade | "") => {
    setSelectedGrade(grade);
    setPage(0);
  };

  return (
    <AppShell>
      <MeaninglessHeader />

      <main className="pb-8 pt-3">
        <section className="px-6">
          <p className="text-label-medium text-brand">Market</p>
          <h1 className="mt-2 text-headline-large text-foreground">
            {sellerId ? (
              <>{sellerNickname ? `@${sellerNickname}` : "판매자"}의 학습자료</>
            ) : (
              <>
                필요한 학습자료를
                <br />
                과목과 학년별로 찾아보세요
              </>
            )}
          </h1>
          {sellerId && (
            <Link
              href="/market"
              className="mt-3 inline-flex text-label-medium text-primary"
            >
              전체 마켓으로 돌아가기
            </Link>
          )}
        </section>

        {!sellerId && (
          <section
            className="sticky top-0 z-10 mt-6 space-y-2 bg-background/95 px-6 py-3 backdrop-blur"
            aria-label="자료 필터"
          >
            <div className="flex gap-1.5 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <button
                type="button"
                aria-pressed={selectedSubjectId === undefined}
                onClick={() => changeSubject()}
                className={`h-8 shrink-0 rounded-full px-3 text-label-medium ${
                  selectedSubjectId === undefined
                    ? "bg-primary text-primary-foreground"
                    : "bg-primary-980 text-muted-foreground"
                }`}
              >
                전체
              </button>
              {subjectOptions.map((subject) => (
                <button
                  key={subject.id}
                  type="button"
                  aria-pressed={selectedSubjectId === subject.id}
                  onClick={() => changeSubject(subject.id)}
                  className={`h-8 shrink-0 rounded-full px-3 text-label-medium ${
                    selectedSubjectId === subject.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-primary-980 text-muted-foreground"
                  }`}
                >
                  {subject.label}
                </button>
              ))}
            </div>
            <div className="flex gap-1.5 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {gradeOptions.map((grade) => (
                <button
                  key={grade.value || "all"}
                  type="button"
                  aria-pressed={selectedGrade === grade.value}
                  onClick={() => changeGrade(grade.value)}
                  className={`h-8 shrink-0 rounded-full px-3 text-label-medium ${
                    selectedGrade === grade.value
                      ? "bg-primary text-primary-foreground"
                      : "bg-primary-980 text-muted-foreground"
                  }`}
                >
                  {grade.label}
                </button>
              ))}
            </div>
          </section>
        )}

        <div className="mt-4 flex items-center justify-between px-6">
          <h2 className="text-title-large text-foreground">
            {sellerId ? "판매 자료" : "학습자료"}
          </h2>
          <span className="text-body-medium text-muted-foreground">
            {marketPage?.totalElements ?? 0}개
          </span>
        </div>

        <section
          className="mt-4 grid grid-cols-2 gap-4 px-6"
          aria-label="자료 목록"
        >
          {activeQuery.isLoading ? (
            [...Array(4)].map((_, index) => (
              <div
                key={index}
                className="h-56 animate-pulse rounded-lg bg-primary-980"
              />
            ))
          ) : activeQuery.isError ? (
            <div className="col-span-2 rounded-lg border border-dashed border-border px-4 py-10 text-center">
              <p className="text-title-small text-foreground">
                자료를 불러오지 못했습니다.
              </p>
              <button
                type="button"
                onClick={() => void activeQuery.refetch()}
                className="mt-3 text-label-medium text-primary"
              >
                다시 시도
              </button>
            </div>
          ) : items.length === 0 ? (
            <div className="col-span-2 rounded-lg border border-dashed border-border px-4 py-10 text-center">
              <p className="text-title-small text-foreground">
                아직 등록된 자료가 없습니다.
              </p>
              <p className="mt-2 text-body-small text-muted-foreground">
                다른 조건을 선택하거나 첫 자료를 등록해보세요.
              </p>
            </div>
          ) : (
            items.map((item) => (
              <article
                key={item.id}
                className="overflow-hidden rounded-lg border border-border bg-card"
              >
                <Link
                  href={`/market/${item.id}`}
                  className="block active:opacity-80"
                >
                  <span className="relative flex h-28 items-center justify-center overflow-hidden bg-primary-980 px-3 text-center text-title-small text-primary">
                    {item.coverImageUrl ? (
                      <Image
                        src={item.coverImageUrl}
                        alt=""
                        fill
                        sizes="(max-width: 640px) 50vw, 200px"
                        unoptimized
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      "학습자료"
                    )}
                    <span className="absolute right-2 top-2 rounded-full bg-card/95 px-2 py-0.5 text-label-small font-medium text-primary">
                      {item.price > 0
                        ? `${item.price.toLocaleString("ko-KR")}원`
                        : "무료"}
                    </span>
                  </span>
                  <span className="block px-3 pb-2 pt-3">
                    <span className="text-label-small font-medium text-brand">
                      {item.subjectName} · {gradeLabel(item.grade)}
                    </span>
                    <strong className="mt-1 line-clamp-2 block min-h-10 text-label-medium text-foreground">
                      {item.title || "제목 없음"}
                    </strong>
                    <span className="mt-2 flex items-center justify-between text-label-small text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Star
                          aria-hidden="true"
                          className="h-3.5 w-3.5 fill-brand text-brand"
                          strokeWidth={1.5}
                        />
                        {item.averageRating ?? 0}
                      </span>
                      <span>{item.purchaseCount ?? 0}회 구매</span>
                    </span>
                    <span className="mt-2 flex items-center gap-3 text-label-small text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Heart
                          aria-hidden="true"
                          className={`h-3.5 w-3.5 ${item.liked ? "fill-primary text-primary" : ""}`}
                        />
                        {item.likeCount ?? 0}
                      </span>
                      {item.scrapped && (
                        <span className="inline-flex items-center gap-1 text-primary">
                          <Bookmark
                            aria-hidden="true"
                            className="h-3.5 w-3.5 fill-current"
                          />
                          스크랩
                        </span>
                      )}
                    </span>
                  </span>
                </Link>
                <Link
                  href={`/market?sellerId=${item.sellerId}`}
                  className="block truncate border-t border-border px-3 py-2 text-label-small font-medium text-muted-foreground"
                >
                  by @{item.sellerNickname || "판매자"}
                </Link>
              </article>
            ))
          )}
        </section>

        {marketPage && marketPage.totalPages > 1 && (
          <nav
            className="mt-7 flex items-center justify-center gap-4"
            aria-label="페이지 이동"
          >
            <button
              type="button"
              disabled={marketPage.first}
              onClick={() => setPage((current) => Math.max(0, current - 1))}
              className="h-10 rounded-xl border border-border px-4 text-label-medium disabled:opacity-40"
            >
              이전
            </button>
            <span className="text-body-small text-muted-foreground">
              {marketPage.number + 1} / {marketPage.totalPages}
            </span>
            <button
              type="button"
              disabled={marketPage.last}
              onClick={() => setPage((current) => current + 1)}
              className="h-10 rounded-xl border border-border px-4 text-label-medium disabled:opacity-40"
            >
              다음
            </button>
          </nav>
        )}
      </main>

      <div className="pointer-events-none fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] left-1/2 z-40 flex w-full max-w-app -translate-x-1/2 justify-end px-6 md:px-8">
        <Link
          href="/market/upload"
          aria-label="자료 올리기"
          className="pointer-events-auto flex h-14 items-center justify-center gap-1.5 rounded-full bg-primary px-5 text-primary-foreground shadow-lg active:scale-95"
        >
          <Plus aria-hidden="true" className="h-6 w-6" strokeWidth={1.8} />
          <span className="whitespace-nowrap text-base font-bold">
            자료 올리기
          </span>
        </Link>
      </div>
    </AppShell>
  );
}

export default function MarketPage() {
  return (
    <Suspense
      fallback={
        <AppShell>
          <MeaninglessHeader />
          <div className="mx-6 mt-8 h-64 animate-pulse rounded-xl bg-primary-980" />
        </AppShell>
      }
    >
      <MarketPageContent />
    </Suspense>
  );
}
