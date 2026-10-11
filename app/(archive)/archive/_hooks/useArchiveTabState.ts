"use client";

import { useRouter } from "@/lib/navigation";
import { useSearchParams, usePathname } from "next/navigation";
import { useEffect } from "react";

// 아카이브 탭 상태 타입 정의
type ArchiveStatus = /*"my-questions" | */ "my-study" | "my-note";

// 기본 상태
const DEFAULT_STATUS: ArchiveStatus = "my-study";
const VALID_STATUSES: ArchiveStatus[] = ["my-study", "my-note"];

const isArchiveStatus = (value: string | null): value is ArchiveStatus =>
  value !== null && VALID_STATUSES.includes(value as ArchiveStatus);

/**
 * ✅ useArchiveTabState
 * 아카이브 페이지 전용 탭 상태 관리 훅
 * - URL 쿼리(status)를 기반으로 현재 탭 상태 유지
 * - 쿼리가 없으면 기본값("my-questions")으로 자동 설정
 */
export const useArchiveTabState = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // 현재 status 값 추출
  const requestedStatus = searchParams.get("status");
  const currentStatus = isArchiveStatus(requestedStatus)
    ? requestedStatus
    : DEFAULT_STATUS;

  // URL에 status 파라미터가 없거나 삭제된 탭이면 기본값으로 정리
  useEffect(() => {
    if (requestedStatus !== currentStatus) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("status", currentStatus);
      router.replace(`${pathname}?${params.toString()}`);
    }
  }, [currentStatus, pathname, requestedStatus, router, searchParams]);

  // ✅ 탭 전환 시 URL 파라미터 갱신
  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("status", value);
    router.push(`${pathname}?${params.toString()}`);
  };

  return {
    currentStatus,
    handleTabChange,
  };
};
