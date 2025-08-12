"use client";

import Link from "next/link";
import { FC } from "react";
import HomeIcon from "@/public/Home.svg";
import CommunityIcon from "@/public/Community.svg";
import QnaIcon from "@/public/Qna.svg";
import ArchiveIcon from "@/public/Archive.svg";
import MyPageIcon from "@/public/Mypage.svg";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  {
    href: "/",
    icon: HomeIcon,
    label: "홈",
  },
  {
    href: "#",
    icon: CommunityIcon,
    label: "커뮤니티",
  },
  {
    href: "/qna",
    icon: QnaIcon,
    label: "질문광장",
  },
  {
    href: "#",
    icon: ArchiveIcon,
    label: "아카이브",
  },
  {
    href: "#",
    icon: MyPageIcon,
    label: "마이 페이지",
  },
];

export const BottomNavbar: FC = () => {
  const pathname = usePathname();

  return (
    <nav className="shadow-t dark:shadow-t-gray-800 fixed bottom-0 left-1/2 z-50 flex h-[5.625rem] w-full max-w-screen-sm -translate-x-1/2 items-center justify-between border-t-[1px] border-[#E2E2E2] bg-transparent px-3 sm:px-6">
      {NAV_ITEMS.map((item) => {
        const IconComponent = item.icon;
        return (
          <Link
            key={`${item.href}-${item.label}`}
            href={item.href}
            className={cn(
              "flex h-[3.125rem] w-[3.125rem] flex-col items-center justify-center text-border transition-colors hover:text-brand focus:text-brand",
              pathname === item.href && "text-brand",
            )}
            prefetch={false}
          >
            <IconComponent
              className={cn(
                "h-8 w-8 focus:text-brand",
                pathname === item.href && "text-brand",
              )}
            />
            <span className="text-[0.625rem]">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
};
