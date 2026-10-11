import type { Metadata } from "next";

import { FlashcardCreateApp } from "@/app/(learn)/learn/_components/FlashcardApp";

export const metadata: Metadata = {
  title: "필챗 · 플래시카드 만들기",
  description: "AI 또는 직접 입력으로 플래시카드를 만드는 페이지",
};

export default async function FlashcardCreatePage({
  searchParams,
}: {
  searchParams: Promise<{ pack?: string | string[] }>;
}) {
  const params = await searchParams;
  const pack = Array.isArray(params.pack) ? params.pack[0] : params.pack;

  return <FlashcardCreateApp initialCollection={pack ?? ""} />;
}
