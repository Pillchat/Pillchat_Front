"use client";

import { useEffect, useRef } from "react";
import { AppShell } from "@/components/molecules/AppShell";

import { LoadingIndicator } from "@/components/atoms/LoadingIndicator";
import { Button } from "@/components/ui/button";
import { useAuthIdentity } from "@/hooks/useAuthIdentity";
import { usePendingStudentVerificationsQuery } from "@/hooks/queries/useStudentVerificationQuery";
import { ApiError } from "@/lib/client/fetch";
import { StudentVerificationRequest } from "./_components/StudentVerificationRequest";

export default function AdminStudentVerificationsPage() {
  const userId = useAuthIdentity();
  return <StudentVerificationList key={userId ?? "guest"} userId={userId} />;
}
function StudentVerificationList({ userId }: { userId: string | null }) {
  const list = usePendingStudentVerificationsQuery();
  const more = useRef<HTMLDivElement>(null);
  const { hasNextPage, isFetching, isError, fetchNextPage } = list;
  useEffect(() => {
    const target = more.current;
    if (!target || !hasNextPage || isFetching || isError) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) void fetchNextPage();
    });
    observer.observe(target);
    return () => observer.disconnect();
  }, [hasNextPage, isFetching, isError, fetchNextPage]);
  const items = list.data?.pages.flatMap((page) => page.items) ?? [];
  const denied =
    list.error instanceof ApiError && [401, 403].includes(list.error.status);
  return (
    <AppShell bottomNav={false} bottomSpacing="none">
      <div className="border-b border-gray-100">
        <header className="flex h-14 items-center px-6 sm:h-16">
          <h1 className="text-headline-medium">학생 인증 관리</h1>
        </header>
      </div>
      <main className="mx-auto max-w-3xl space-y-10 px-6 pb-10 pt-8">
        {!userId ? (
          <p role="alert" className="text-body-medium text-gray-800">
            관리자 계정으로 로그인해주세요.
          </p>
        ) : list.isPending ? (
          <LoadingIndicator
            label="인증 요청을 불러오는 중…"
            className="py-12"
          />
        ) : (
          <>
            {items.map((request) => (
              <StudentVerificationRequest key={request.id} request={request} />
            ))}
            {list.isError ? (
              <div
                role="alert"
                className="space-y-3 text-body-medium text-gray-800"
              >
                <p>
                  {denied
                    ? "관리자 계정만 이용할 수 있습니다."
                    : "인증 요청을 불러오지 못했어요. 다시 시도해주세요."}
                </p>
                {!denied && (
                  <Button variant="outline" onClick={() => void list.refetch()}>
                    다시 확인
                  </Button>
                )}
              </div>
            ) : (
              !items.length && (
                <p role="status" className="text-body-medium text-gray-800">
                  대기 중인 인증 요청이 없습니다.
                </p>
              )
            )}
            <div ref={more} aria-hidden="true" className="h-px" />
            {list.isFetchingNextPage && (
              <LoadingIndicator label="다음 인증 요청을 불러오는 중…" />
            )}
          </>
        )}
      </main>
    </AppShell>
  );
}
