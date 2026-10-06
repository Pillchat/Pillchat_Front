import type { Metadata } from "next";

import { FlashcardTutorialApp } from "@/app/(learn)/learn/_components/FlashcardTutorialApp";

export const metadata: Metadata = {
  title: "필챗 · 플래시카드 사용법",
  description:
    "예제 카드로 직접 눌러 보고 넘기며 플래시카드 사용법을 익혀보세요.",
};

export default function FlashcardTutorialPage() {
  return <FlashcardTutorialApp />;
}
