import Link from "next/link";
import { BookOpenCheck, FileText, MessageCircle, Star } from "lucide-react";

import { AppShell, MeaninglessHeader } from "@/components/molecules";

const boards = [
  {
    href: "/tips",
    title: "꿀팁 게시판",
    description: "시험, 실습, 공부 루틴에 도움이 되는 노하우를 모아요.",
    icon: BookOpenCheck,
    meta: "학습/시험 노하우",
  },
  {
    href: "/board",
    title: "자유 게시판",
    description: "약대 생활, 일상, 잡담을 가볍게 나누는 공간이에요.",
    icon: MessageCircle,
    meta: "일상/잡담",
  },
  {
    href: "/reviews",
    title: "후기 게시판",
    description: "강의, 자료, 실습 경험을 기록하고 비교해요.",
    icon: Star,
    meta: "강의/자료/실습",
  },
  {
    href: "/upload",
    title: "학습자료 공유",
    description: "요약본, 실습 자료, 강의자료 공유는 커뮤니티 안에서 이어가요.",
    icon: FileText,
    meta: "자료 공유",
  },
];

export default function BoardsHubPage() {
  return (
    <AppShell>
      <MeaninglessHeader />

      <main className="px-6 pb-8 pt-3">
        <section>
          <p className="text-sm font-semibold text-brand">Community</p>
          <h1 className="mt-2 text-2xl font-bold leading-9 text-foreground">
            필요한 이야기를
            <br />
            게시판과 자료에서 찾아보세요
          </h1>
        </section>

        <section className="mt-8 flex flex-col gap-3" aria-label="게시판 목록">
          {boards.map((board) => {
            const Icon = board.icon;

            return (
              <Link
                key={board.href}
                href={board.href}
                className="flex items-center gap-4 rounded-lg border border-border bg-card p-4 transition-transform active:scale-[0.98]"
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-accent text-brand">
                  <Icon aria-hidden="true" className="h-6 w-6" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="text-xs font-semibold text-brand">
                    {board.meta}
                  </span>
                  <strong className="mt-1 block text-lg font-semibold text-foreground">
                    {board.title}
                  </strong>
                  <span className="mt-1 block text-sm leading-5 text-muted-foreground">
                    {board.description}
                  </span>
                </span>
              </Link>
            );
          })}
        </section>
      </main>
    </AppShell>
  );
}
