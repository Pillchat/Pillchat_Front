"use client";

import { FC } from "react";
import Link from "next/link";

export const GeneralHeader: FC = () => {
  return (
    <header className="sticky top-0 z-10 flex w-full items-center justify-between border-b border-border/40 bg-background/95 px-6 py-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <Link href="/" className="flex h-[3.625rem] cursor-pointer items-center">
        <img src="/PillChat.svg" alt="logo" width={82} height={32} />
      </Link>
      <div className="flex items-center gap-4">
        {/* TODO: 검색 기능 추가 */}
        <div className="flex h-[3.625rem] items-center">
          <img src="/search.svg" alt="search" width={32} height={32} />
        </div>
        {/* TODO: 알림 기능 추가 */}
        <div className="flex h-[3.625rem] items-center">
          <img src="/Bell.svg" alt="notification" width={32} height={32} />
        </div>
      </div>
    </header>
  );
};
