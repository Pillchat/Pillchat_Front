"use client";

import { FC } from "react";
import { useRouter } from "next/navigation";

export const GeneralHeader: FC = () => {
  const router = useRouter();

  return (
    <header className="flex w-full items-center justify-between px-6 py-4">
      <div
        className="flex h-[3.625rem] cursor-pointer items-center"
        onClick={() => router.push("/")}
      >
        <img src="/PillChat.svg" alt="logo" width={82} height={32} />
      </div>
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
