"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo } from "react";

export type BoardStatus = "best" | "latest" | "study" | "column" | "promo";

const DEFAULT_STATUS: BoardStatus = "best";

const normalizeStatus = (s: string | null): BoardStatus => {
  if (
    s === "best" ||
    s === "latest" ||
    s === "study" ||
    s === "column" ||
    s === "promo"
  )
    return s;
  return DEFAULT_STATUS;
};

export const useBoardTabState = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentStatus = useMemo(
    () => normalizeStatus(searchParams.get("status")),
    [searchParams],
  );

  useEffect(() => {
    const raw = searchParams.get("status");
    if (raw && normalizeStatus(raw) === raw) return;

    const params = new URLSearchParams(searchParams.toString());
    params.set("status", DEFAULT_STATUS);
    router.replace(`/board?${params.toString()}`);
  }, [router, searchParams]);

  const handleTabChange = (value: BoardStatus) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("status", value);
    router.push(`/board?${params.toString()}`);
  };

  return { currentStatus, handleTabChange };
};
