"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useAuthIdentity } from "@/hooks/useAuthIdentity";
import { AppShell } from "@/components/molecules/AppShell";
import { PracticeHeader } from "@/components/molecules/PracticeHeader";
import { Button } from "@/components/ui/button";

export function WeaknessAccess({
  returnTo,
  children,
}: {
  returnTo: string;
  children: ReactNode;
}) {
  const userId = useAuthIdentity();
  if (userId) return children;

  return (
    <AppShell>
      <PracticeHeader title="약점공략" backHref="/" separator={false} />
      <main className="px-6 py-8">
        <div className="space-y-4 rounded-2xl bg-gray-50 p-5">
          <h1 className="text-headline-small">
            나의 약점 문제를 모아 복습해요
          </h1>
          <p className="text-body-medium text-muted-foreground">
            학습 기록을 확인하려면 로그인이 필요해요. 로그인하면 보고 있던
            약점공략으로 돌아와요.
          </p>
          <Button asChild className="w-full">
            <Link href={`/login?returnTo=${encodeURIComponent(returnTo)}`}>
              로그인하고 약점공략 보기
            </Link>
          </Button>
        </div>
      </main>
    </AppShell>
  );
}
