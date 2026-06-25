import Link from "next/link";
import { PenLine } from "lucide-react";

import { AppShell, CustomHeader } from "@/components/molecules";

const tips = [
  "약물학 암기 루틴 공유",
  "실습 전날 체크리스트",
  "국시 과목별 회독 순서",
];

export default function TipsPage() {
  return (
    <AppShell>
      <CustomHeader title="꿀팁 게시판" />

      <main className="px-6 pb-8 pt-4">
        <p className="text-sm leading-6 text-muted-foreground">
          학습과 시험에 도움이 되는 노하우 게시판입니다. 실제 목록 API가
          연결되기 전까지는 진입 화면으로 동작합니다.
        </p>

        <section className="mt-6 flex flex-col gap-3" aria-label="추천 꿀팁">
          {tips.map((title) => (
            <div
              key={title}
              className="flex items-center gap-3 border-b border-border py-3 last:border-b-0"
            >
              <PenLine aria-hidden="true" className="h-5 w-5 text-brand" />
              <span className="text-base font-medium text-foreground">
                {title}
              </span>
            </div>
          ))}
        </section>

        <Link
          href="/board"
          className="mt-8 flex h-12 items-center justify-center rounded-xl bg-primary text-base font-semibold text-primary-foreground active:scale-[0.98]"
        >
          자유 게시판에서 먼저 둘러보기
        </Link>
      </main>

    </AppShell>
  );
}
