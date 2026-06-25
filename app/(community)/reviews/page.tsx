import Link from "next/link";
import { Star } from "lucide-react";

import { AppShell, CustomHeader } from "@/components/molecules";

const reviews = [
  "강의 후기",
  "학습자료 후기",
  "실습 경험 후기",
];

export default function ReviewsPage() {
  return (
    <AppShell>
      <CustomHeader title="후기 게시판" />

      <main className="px-6 pb-8 pt-4">
        <p className="text-sm leading-6 text-muted-foreground">
          강의, 자료, 실습 경험을 모아보는 후기 게시판입니다. 실제 목록 API가
          연결되기 전까지는 진입 화면으로 동작합니다.
        </p>

        <section className="mt-6 grid grid-cols-3 gap-2" aria-label="후기 유형">
          {reviews.map((title) => (
            <div
              key={title}
              className="flex min-h-24 flex-col items-center justify-center gap-2 rounded-lg bg-accent px-2 text-center"
            >
              <Star aria-hidden="true" className="h-5 w-5 text-brand" />
              <span className="text-sm font-semibold text-foreground">
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
