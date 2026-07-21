"use client";

import Link from "next/link";
import Image from "next/image";
import { FC } from "react";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  {
    href: "/",
    iconSrc: "/Home.svg",
    checkedIconSrc: "/CheckedHome.svg",
    label: "홈",
    isActive: (pathname: string) => pathname === "/",
  },
  {
    href: "/learn",
    iconSrc: "/learn.svg",
    checkedIconSrc: "/CheckedLearn.svg",
    label: "학습",
    isActive: (pathname: string) =>
      pathname.startsWith("/learn") ||
      pathname.startsWith("/flashcards") ||
      pathname.startsWith("/questionbank"),
  },
  {
    href: "/boards",
    iconSrc: "/Board.svg",
    checkedIconSrc: "/CheckedBoard.svg",
    label: "게시판",
    isActive: (pathname: string) =>
      pathname.startsWith("/boards") ||
      pathname.startsWith("/board") ||
      pathname.startsWith("/post") ||
      pathname.startsWith("/tips") ||
      pathname.startsWith("/reviews"),
  },
  {
    href: "/cheer",
    iconSrc: "/cheer.svg",
    checkedIconSrc: "/CheckedCheer.svg",
    label: "응원방",
    isActive: (pathname: string) => pathname.startsWith("/cheer"),
  },
  {
    href: "/market",
    iconSrc: "/market.svg",
    checkedIconSrc: "/CheckedMarket.svg",
    label: "마켓",
    isActive: (pathname: string) => pathname.startsWith("/market"),
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
        "fixed bottom-0 left-1/2 z-50 grid h-[calc(5.25rem+env(safe-area-inset-bottom))] w-full max-w-app -translate-x-1/2 grid-cols-5 items-start border-t border-gray-300 bg-white pb-[env(safe-area-inset-bottom)]",
        className,
      )}
    >
      {NAV_ITEMS.map((item) => {
        const isActive = item.isActive(pathname);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "relative flex h-[70px] w-full min-w-0 flex-col items-center justify-center gap-0.5 text-[10px] leading-[14px] text-gray-300 transition-colors active:scale-95",
              isActive && "text-foreground",
            )}
            prefetch={false}
            aria-current={isActive ? "page" : undefined}
          >
            <span className="relative flex h-8 w-8 items-center justify-center">
              {isActive ? (
                <Image
                  src={item.checkedIconSrc}
                  alt=""
                  width={32}
                  height={32}
                  className="h-8 w-8"
                />
              ) : (
                <span
                  aria-hidden="true"
                  className="h-8 w-8 bg-current transition-colors"
                  style={{
                    WebkitMaskImage: `url(${item.iconSrc})`,
                    WebkitMaskPosition: "center",
                    WebkitMaskRepeat: "no-repeat",
                    WebkitMaskSize: "contain",
                    maskImage: `url(${item.iconSrc})`,
                    maskPosition: "center",
                    maskRepeat: "no-repeat",
                    maskSize: "contain",
                  }}
                />
              )}
            </span>
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
};
