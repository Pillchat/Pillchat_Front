"use client";

import Link from "next/link";
import { FC } from "react";
import {
  Flame,
  GraduationCap,
  Home,
  LayoutGrid,
  ShoppingBag,
} from "lucide-react";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  {
    href: "/",
    icon: Home,
    label: "홈",
    isActive: (pathname: string) => pathname === "/",
  },
  {
    href: "/learn",
    icon: GraduationCap,
    label: "학습",
    badge: "9월",
    isActive: (pathname: string) => pathname.startsWith("/learn"),
  },
  {
    href: "/boards",
    icon: LayoutGrid,
    label: "게시판",
    isActive: (pathname: string) =>
      pathname.startsWith("/boards") ||
      pathname.startsWith("/board") ||
      pathname.startsWith("/tips") ||
      pathname.startsWith("/reviews"),
  },
  {
    href: "/cheer",
    icon: Flame,
    label: "응원방",
    isActive: (pathname: string) => pathname.startsWith("/cheer"),
  },
  {
    href: "/market",
    icon: ShoppingBag,
    label: "마켓",
    isActive: (pathname: string) =>
      pathname.startsWith("/market") || pathname.startsWith("/materials"),
  },
];

interface BottomNavbarProps {
  className?: string;
}

export const BottomNavbar: FC<BottomNavbarProps> = ({ className }) => {
  const pathname = usePathname();

  return (
    <nav
      aria-label="하단 네비게이션"
      className={cn(
        "fixed bottom-0 left-1/2 z-50 flex h-[calc(5.75rem+env(safe-area-inset-bottom))] w-full max-w-[480px] -translate-x-1/2 items-start justify-between border-t border-border bg-background px-3 pb-[env(safe-area-inset-bottom)] pt-3 shadow-[0_-8px_24px_rgba(17,17,17,0.04)]",
        className,
      )}
    >
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = item.isActive(pathname);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "relative flex h-14 min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-lg text-muted-foreground transition-colors active:scale-95",
              isActive && "text-brand",
            )}
            prefetch={false}
            aria-current={isActive ? "page" : undefined}
          >
            <span className="relative">
              <Icon aria-hidden="true" className="h-6 w-6" />
              {item.badge && (
                <span className="absolute -right-4 -top-2 rounded-full bg-brand px-1.5 py-0.5 text-[0.5rem] font-semibold leading-none text-white">
                  {item.badge}
                </span>
              )}
            </span>
            <span className="text-[0.6875rem] font-medium leading-none">
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
};
