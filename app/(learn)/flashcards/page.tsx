import type { Metadata } from "next";

import { FlashcardApp } from "@/app/(learn)/learn/_components/FlashcardApp";

export const metadata: Metadata = {
  title: "필챗 · 플래시카드",
  description: "SRS 기반 플래시카드 학습 페이지",
};

export default function FlashcardsAliasPage() {
  return <FlashcardApp />;
}
