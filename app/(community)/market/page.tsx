"use client";

import Link from "next/link";
import { Plus, Star } from "lucide-react";
import { useMemo, useState } from "react";

import { AppShell, MeaninglessHeader } from "@/components/molecules";

const grades = ["전체", "1학년", "2학년", "3학년", "4학년", "5학년", "6학년"];
const categories = ["약물학", "유기화학", "약제학", "병태생리"];
const materials = [
  {
    id: "pharm-101",
    emoji: "💊",
    title: "약물학 핵심 요약 노트",
    author: "약대생 민지",
    rating: 4.8,
    price: 4900,
    grade: "3학년",
  },
  {
    id: "organic-quiz",
    emoji: "🧪",
    title: "유기화학 반응 문제집",
    author: "익명_약대생",
    rating: 4.6,
    price: 0,
    grade: "2학년",
  },
  {
    id: "practice-pack",
    emoji: "📚",
    title: "실습 전 체크리스트 묶음",
    author: "선배약사",
    rating: 4.9,
    price: 7900,
    grade: "5학년",
  },
];

export default function MarketPage() {
  const [selectedGrade, setSelectedGrade] = useState("전체");

  const filteredMaterials = useMemo(() => {
    if (selectedGrade === "전체") return materials;
    return materials.filter((item) => item.grade === selectedGrade);
  }, [selectedGrade]);

  return (
    <AppShell>
      <MeaninglessHeader />

      <main className="px-6 pb-8 pt-3">
        <section>
          <p className="text-sm font-semibold text-brand">Market</p>
          <h1 className="mt-2 text-2xl font-bold leading-9 text-foreground">
            필요한 학습자료를
            <br />
            학년별로 찾아보세요
          </h1>
        </section>

        <section className="mt-7" aria-label="학년 필터">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {grades.map((grade, index) => (
              <button
                key={grade}
                type="button"
                aria-pressed={selectedGrade === grade}
                onClick={() => setSelectedGrade(grade)}
                className={`h-9 shrink-0 rounded-full px-4 text-sm font-medium ${
                  selectedGrade === grade
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-gray-800"
                }`}
              >
                {grade}
              </button>
            ))}
          </div>
        </section>

        <section className="mt-3" aria-label="과목 주제">
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <span
                key={category}
                className="h-8 rounded-full border border-border px-3 text-xs font-medium text-muted-foreground"
              >
                {category}
              </span>
            ))}
          </div>
        </section>

        <div className="mt-6 flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground">
            {selectedGrade} 자료
          </h2>
          <span className="text-sm text-muted-foreground">
            {filteredMaterials.length}개
          </span>
        </div>

        <section className="mt-7 flex flex-col gap-3" aria-label="자료 목록">
          {filteredMaterials.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border px-4 py-10 text-center">
              <p className="text-sm font-medium text-foreground">
                아직 등록된 자료가 없습니다.
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                다른 학년을 선택하거나 첫 자료를 등록해보세요.
              </p>
            </div>
          ) : (
            filteredMaterials.map((item) => (
              <Link
                key={item.id}
                href={`/market/${item.id}`}
                className="flex gap-4 rounded-lg border border-border bg-card p-4 active:scale-[0.98]"
              >
                <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg bg-primary-980 text-3xl">
                  {item.emoji}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="text-xs font-semibold text-brand">
                    {item.grade}
                  </span>
                  <strong className="mt-1 block truncate text-base font-semibold text-foreground">
                    {item.title}
                  </strong>
                  <span className="mt-1 block text-sm text-muted-foreground">
                    {item.author}
                  </span>
                  <span className="mt-3 flex items-center justify-between">
                    <span className="flex items-center gap-1 text-sm font-medium text-foreground">
                      <Star
                        aria-hidden="true"
                        className="h-4 w-4 fill-brand text-brand"
                      />
                      {item.rating}
                    </span>
                    <span className="text-sm font-bold text-foreground">
                      {item.price === 0
                        ? "무료"
                        : `${item.price.toLocaleString("ko-KR")}원`}
                    </span>
                  </span>
                </span>
              </Link>
            ))
          )}
        </section>
      </main>

      <Link
        href="/market/upload"
        aria-label="자료 등록"
        className="fixed bottom-[calc(6.75rem+env(safe-area-inset-bottom))] left-1/2 z-40 ml-[156px] flex h-14 w-14 -translate-x-1/2 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg active:scale-95"
      >
        <Plus aria-hidden="true" className="h-6 w-6" />
      </Link>
    </AppShell>
  );
}
