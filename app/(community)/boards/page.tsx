import Link from "next/link";

import { AppShell, MeaninglessHeader } from "@/components/molecules";

const boards = [
  {
    href: "/tips",
    title: "꿀팁 게시판",
    description: "시험, 실습, 공부 루틴에 도움이 되는 노하우를 모아요.",
    iconSrc: "/Tip.svg",
    meta: "학습/시험 노하우",
  },
  {
    href: "/board",
    title: "자유 게시판",
    description: "약대 생활, 일상, 잡담을 가볍게 나누는 공간이에요.",
    iconSrc: "/Talk.svg",
    meta: "일상/잡담",
  },
  {
    href: "/reviews",
    title: "후기 게시판",
    description: "강의, 자료, 실습 경험을 기록하고 비교해요.",
    iconSrc: "/Star.svg",
    meta: "강의/자료/실습",
  },
];

export default function BoardsHubPage() {
  return (
    <AppShell>
      <MeaninglessHeader />

      <main className="px-6 pb-8 pt-3">
        <section>
          <p className="text-label-medium text-brand">Community</p>
          <h1 className="mt-2 text-headline-large text-foreground">
            필요한 이야기를
            <br />
            게시판별로 빠르게 찾아보세요
          </h1>
        </section>

        <section className="mt-8 flex flex-col gap-4" aria-label="게시판 목록">
          {boards.map((board) => (
            <Link
              key={board.href}
              href={board.href}
              className="flex items-center gap-4 rounded-lg bg-primary-980 p-4 transition-transform active:scale-[0.98]"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-accent text-brand">
                <span
                  aria-hidden="true"
                  className="h-8 w-8 bg-current"
                  style={{
                    WebkitMaskImage: `url(${board.iconSrc})`,
                    WebkitMaskPosition: "center",
                    WebkitMaskRepeat: "no-repeat",
                    WebkitMaskSize: "contain",
                    maskImage: `url(${board.iconSrc})`,
                    maskPosition: "center",
                    maskRepeat: "no-repeat",
                    maskSize: "contain",
                  }}
                />
              </span>
              <span className="min-w-0 flex-1">
                <span className="text-label-medium text-primary-600">
                  {board.meta}
                </span>
                <strong className="mt-2 block text-headline-small text-foreground">
                  {board.title}
                </strong>
                <span className="mt-1 block text-body-medium text-gray-800">
                  {board.description}
                </span>
              </span>
            </Link>
          ))}
        </section>
      </main>
    </AppShell>
  );
}
