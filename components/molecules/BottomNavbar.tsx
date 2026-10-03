"use client";

import Link from "next/link";
import { FC } from "react";
import HomeIcon from "@/public/icons/home.svg";
import QuestionBankIcon from "@/public/icons/question-bank.svg";
import ArchiveIcon from "@/public/icons/archive.svg";
import MyPageIcon from "@/public/icons/user.svg";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  {
    href: "/",
    icon: HomeIcon,
    label: "홈",
  },
  {
    href: "/learn",
    icon: QuestionBankIcon,
    label: "학습",
  },
  {
    href: "/archive",
    icon: ArchiveIcon,
    label: "아카이브",
  },
  {
    href: "/mypage",
    icon: MyPageIcon,
    label: "마이 페이지",
  },
];

const LEARNING_PATHS = ["/learn", "/learning", "/questionbank", "/flashcards"];

const matchesPath = (pathname: string, path: string) =>
  pathname === path || pathname.startsWith(`${path}/`);

const isNavItemActive = (pathname: string, href: string) => {
  if (href === "/") return pathname === href;
  if (href === "/learn") {
    return LEARNING_PATHS.some((path) => matchesPath(pathname, path));
  }

  return matchesPath(pathname, href);
};

interface BottomNavbarProps {
  className?: string;
}

export const BottomNavbar: FC<BottomNavbarProps> = ({ className }) => {
  const pathname = usePathname();

  return (
    <nav
      className={cn(
        "shadow-t dark:shadow-t-gray-800 fixed bottom-0 left-1/2 z-50 flex h-[calc(6.75rem+env(safe-area-inset-bottom))] w-full max-w-screen-sm -translate-x-1/2 items-start justify-between border-t-[1px] border-[#E2E2E2] bg-background px-3 pb-[env(safe-area-inset-bottom)] pt-4 transition-all duration-200 sm:px-6 md:max-w-app md:px-10",
        className,
      )}
    >
      {NAV_ITEMS.map((item) => {
        const IconComponent = item.icon;
        const isActive = isNavItemActive(pathname, item.href);

        return (
          <Link
            key={`${item.href}-${item.label}`}
            href={item.href}
            className={cn(
              "flex h-[3.125rem] w-[3.125rem] flex-col items-center justify-center text-border transition-colors hover:text-brand focus:text-brand",
              isActive && "text-brand",
            )}
            prefetch={false}
          >
            <IconComponent
              className={cn(
                "h-8 w-8 focus:text-brand",
                isActive && "text-brand",
              )}
            />
            <span className="text-[0.625rem]">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
};
