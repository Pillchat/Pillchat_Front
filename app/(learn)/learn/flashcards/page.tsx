import type { Metadata } from "next";

import { FlashcardApp } from "../_components/FlashcardApp";

export const metadata: Metadata = {
  title: "필챗 · 의약학 전공자를 위한 플래시 카드",
  description:
    "Anki 알고리즘, 즉시 피드백, 카드 뒤집기 UX를 결합한 의약학 플래시 카드 학습 앱 필챗.",
};

export default function FlashcardsPage() {
  return <FlashcardApp />;
}
