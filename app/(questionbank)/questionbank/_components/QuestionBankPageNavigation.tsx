"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  ArrowLeft,
  BookOpenCheck,
  FolderOpen,
  NotebookPen,
  UserRound,
} from "lucide-react";

type PageTab = {
  href: string;
  label: string;
  icon: LucideIcon;
  isBack?: boolean;
};

const pageTabs: PageTab[] = [
  {
    href: "/learn",
    label: "뒤로",
    icon: ArrowLeft,
    isBack: true,
  },
  {
    href: "/questionbank",
    label: "홈",
    icon: BookOpenCheck,
  },
  {
    href: "/questionbank/subjects",
    label: "내 과목",
    icon: FolderOpen,
  },
  {
    href: "/questionbank/wrong-notes",
    label: "오답노트",
    icon: NotebookPen,
  },
  {
    href: "/questionbank/me",
    label: "마이페이지",
    icon: UserRound,
  },
];

export function QuestionBankPageNavigation() {
  const pathname = usePathname();

  const isActive = (href: string, isBack?: boolean) => {
    if (isBack) return false;

    return href === "/questionbank"
      ? pathname === href
      : pathname.startsWith(href);
  };

  return (
    <nav
      aria-label="문제은행 전용 네비게이션"
      className="fixed bottom-0 left-1/2 z-50 grid h-[calc(4.5rem+env(safe-area-inset-bottom))] w-full max-w-app -translate-x-1/2 grid-cols-5 border-t border-gray-300 bg-white pb-[env(safe-area-inset-bottom)]"
    >
      {pageTabs.map((item) => {
        const Icon = item.icon;
        const active = isActive(item.href, item.isBack);

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            aria-label={item.isBack ? "학습 페이지로 돌아가기" : undefined}
            className={`relative flex h-[70px] w-full min-w-0 flex-col items-center justify-center gap-1 text-label-small font-semibold transition-colors active:scale-95 ${
              active ? "text-primary" : "text-muted-foreground"
            }`}
            prefetch={false}
          >
            <Icon aria-hidden="true" className="h-5 w-5" strokeWidth={2} />
            <span className="truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
