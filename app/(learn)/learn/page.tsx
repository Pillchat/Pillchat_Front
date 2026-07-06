"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Bell } from "lucide-react";
import { useState } from "react";

import { Toast } from "@/components/atoms";
import { AppShell } from "@/components/molecules";
import { Button } from "@/components/ui/button";

const previewItems = [
  {
    title: "AI 플래시카드",
    description: "취약 개념을 반복해서 복습하는 학습 루틴",
    href: "/flashcards",
    iconSrc: "/FlashCard.svg",
  },
  {
    title: "문제 은행",
    description: "국시 유형을 실전처럼 풀어보는 문제 환경",
    href: "/questionbank",
    iconSrc: "/CBT.svg",
  },
  {
    title: "서술형 메이커",
    description: "키워드와 이미지로 정리하는 암기 보조",
    iconSrc: "/Image2.svg",
  },
];

function ToolIcon({ src }: { src: string }) {
  return (
    <Image
      src={src}
      alt=""
      width={32}
      height={32}
      aria-hidden="true"
      className="h-8 w-8"
    />
  );
}

export default function LearnPage() {
  const [toastOpen, setToastOpen] = useState(false);

  return (
    <AppShell bottomSpacing="cta" className="flex flex-col">
      <header className="flex h-[5.625rem] items-center justify-between px-6">
        <Link href="/" aria-label="홈으로 이동" className="flex items-center">
          <Image
            src="/brand/PillChat.svg"
            alt="PillChat"
            width={82}
            height={32}
            priority
          />
        </Link>
        <span className="rounded-full bg-accent px-3 py-1 text-xs font-semibold text-brand">
          9월 오픈
        </span>
      </header>

      <main className="flex flex-1 flex-col px-6 pt-10">
        <section>
          <p className="text-sm font-semibold text-brand">PillChat Learn</p>
          <h1 className="mt-3 text-[2rem] font-bold leading-[2.75rem] text-foreground">
            약대 학습 솔루션,
            <br />
            9월 전격 출시!
          </h1>
          <p className="mt-4 text-base font-medium leading-7 text-muted-foreground">
            약대생의 복습, 기출 풀이, 서술형 암기를 한 흐름으로 이어주는 학습
            탭을 준비하고 있어요.
          </p>
        </section>

        <section
          className="mt-10 flex flex-col gap-3"
          aria-label="출시 예정 기능"
        >
          {previewItems.map((item) => {
            const content = (
              <>
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-accent text-foreground">
                  <ToolIcon src={item.iconSrc} />
                </span>
                <span className="min-w-0">
                  <strong className="block text-base font-semibold text-foreground">
                    {item.title}
                  </strong>
                  <span className="mt-1 block text-sm leading-5 text-muted-foreground">
                    {item.description}
                  </span>
                </span>
              </>
            );

            return item.href ? (
              <Link
                key={item.title}
                href={item.href}
                className="flex items-center gap-3 border-b border-border py-4 transition-transform last:border-b-0 active:scale-[0.98]"
              >
                {content}
              </Link>
            ) : (
              <div
                key={item.title}
                className="flex items-center gap-3 border-b border-border py-4 last:border-b-0"
              >
                {content}
              </div>
            );
          })}
        </section>
      </main>

      <div className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] left-1/2 z-40 w-full max-w-app -translate-x-1/2 bg-background px-6 py-3 md:px-8">
        <Button
          type="button"
          className="h-14 w-full gap-1 active:scale-[0.98]"
          onClick={() => setToastOpen(true)}
        >
          <Bell aria-hidden="true" className="h-5 w-5" strokeWidth={1.5} />
          <p>오픈 알림 신청하고 혜택 받기</p>
        </Button>
      </div>

      <Toast
        open={toastOpen}
        onClose={() => setToastOpen(false)}
        message="알림 신청이 완료되었습니다! 9월 오픈 시 가장 먼저 안내해 드립니다."
      />
    </AppShell>
  );
}
