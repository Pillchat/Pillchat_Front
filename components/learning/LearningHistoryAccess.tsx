"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAuthIdentity } from "@/hooks/useAuthIdentity";
import { PracticeHeader } from "@/components/molecules/PracticeHeader";
import { Button } from "@/components/ui/button";
import { historyListHref, readHistoryFilter } from "@/lib/learning/history";

export function LearningHistoryAccess({
  view,
  children,
}: {
  view: "recent" | "all";
  children: ReactNode;
}) {
  const user = useAuthIdentity();
  const searchParams = useSearchParams();
  if (user) return children;
  const recent = view === "recent";
  const returnTo = historyListHref(
    view,
    readHistoryFilter(searchParams.get("filter")),
  );
  return (
    <div className="mx-auto min-h-dvh max-w-screen-sm bg-white">
      <PracticeHeader
        title={recent ? "최근 학습" : "전체 학습 기록"}
        backHref={recent ? "/questionbank" : "/mypage"}
        separator={false}
      />
      <main className="px-6 py-8">
        <div className="space-y-4 rounded-2xl bg-gray-50 p-5">
          <h1 className="text-headline-small">나의 학습 기록을 확인해요</h1>
          <p className="text-body-medium text-muted-foreground">
            학습 기록을 보려면 로그인이 필요해요. 로그인하면 보고 있던 목록으로
            돌아와요.
          </p>
          <Button asChild className="w-full">
            <Link href={`/login?returnTo=${encodeURIComponent(returnTo)}`}>
              로그인하고 학습 기록 보기
            </Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
