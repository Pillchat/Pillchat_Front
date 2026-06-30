"use client";

import { ChevronLeft, ChevronRight, Lock } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const previewPages = [
  {
    title: "핵심 개념 정리",
    eyebrow: "1 / 4",
    body: [
      "시험에 자주 나오는 개념을 먼저 훑고 세부 암기로 이어갑니다.",
      "각 장은 정의, 비교 포인트, 빈출 예시 순서로 구성됩니다.",
    ],
  },
  {
    title: "빈출 포인트",
    eyebrow: "2 / 4",
    body: [
      "헷갈리는 약물군은 표로 묶어 차이를 빠르게 확인합니다.",
      "실습과 국시 문제에서 반복되는 키워드를 별도로 표시합니다.",
    ],
  },
  {
    title: "암기 체크",
    eyebrow: "3 / 4",
    body: [
      "복습 직전에 풀 수 있는 짧은 체크 문항을 제공합니다.",
      "틀린 문항은 다시 노트로 돌아가 확인할 수 있도록 구성됩니다.",
    ],
  },
  {
    title: "전체 자료",
    eyebrow: "4 / 4",
    body: ["구매 후 전체 페이지와 첨부 파일을 열람할 수 있습니다."],
    locked: true,
  },
];

interface PreviewModalProps {
  title: string;
  priceLabel: string;
}

export function PreviewModal({ title, priceLabel }: PreviewModalProps) {
  const [pageIndex, setPageIndex] = useState(0);
  const page = previewPages[pageIndex];

  const goPrevious = () => setPageIndex((current) => Math.max(0, current - 1));
  const goNext = () =>
    setPageIndex((current) => Math.min(previewPages.length - 1, current + 1));

  return (
    <Dialog onOpenChange={() => setPageIndex(0)}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-card px-5 text-sm font-semibold text-brand active:scale-[0.98]"
        >
          맛보기 보기
        </button>
      </DialogTrigger>
      <DialogContent className="w-[calc(100%-2rem)] max-w-[440px] overflow-hidden p-0">
        <DialogHeader className="border-b border-border px-5 pb-4 pt-5 text-left">
          <DialogTitle className="pr-8 text-lg">{title}</DialogTitle>
          <DialogDescription>
            구매 전 일부 페이지를 확인해보세요.
          </DialogDescription>
        </DialogHeader>

        <div className="px-5 py-5">
          <div className="relative flex aspect-[3/4] flex-col rounded-lg border border-border bg-card p-5">
            <span className="text-xs font-semibold text-brand">
              {page.eyebrow}
            </span>
            <h3 className="mt-4 text-xl font-bold text-foreground">
              {page.title}
            </h3>
            <div
              className={cn(
                "mt-6 flex flex-col gap-3",
                page.locked && "blur-sm",
              )}
            >
              {page.body.map((line) => (
                <p
                  key={line}
                  className="text-sm leading-6 text-muted-foreground"
                >
                  {line}
                </p>
              ))}
            </div>

            {page.locked && (
              <div className="absolute inset-0 flex flex-col items-center justify-center rounded-lg bg-card/85 px-8 text-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-980 text-brand">
                  <Lock aria-hidden="true" className="h-5 w-5" />
                </span>
                <strong className="mt-4 text-base font-semibold text-foreground">
                  구매 후 전체 열람 가능
                </strong>
                <p className="mt-2 text-sm leading-5 text-muted-foreground">
                  마지막 페이지와 첨부 파일은 구매 후 열립니다.
                </p>
              </div>
            )}
          </div>

          <div className="mt-4 flex items-center justify-between">
            <button
              type="button"
              aria-label="이전 미리보기"
              onClick={goPrevious}
              disabled={pageIndex === 0}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-border text-foreground disabled:opacity-30"
            >
              <ChevronLeft aria-hidden="true" className="h-5 w-5" />
            </button>
            <span className="text-sm font-medium text-muted-foreground">
              {pageIndex + 1} / {previewPages.length}
            </span>
            <button
              type="button"
              aria-label="다음 미리보기"
              onClick={goNext}
              disabled={pageIndex === previewPages.length - 1}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-border text-foreground disabled:opacity-30"
            >
              <ChevronRight aria-hidden="true" className="h-5 w-5" />
            </button>
          </div>

          <Button type="button" className="mt-5 w-full">
            {priceLabel} 구매하기
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
