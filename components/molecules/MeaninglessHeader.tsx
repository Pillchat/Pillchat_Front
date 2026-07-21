"use client";

import { FC } from "react";
import Link from "next/link";
import { useAtomValue } from "jotai";

import { useRouter } from "@/lib/navigation";
import { unreadCountAtom } from "@/store/notification";

interface MeaninglessHeaderProps {
  showActions?: boolean;
}

export const MeaninglessHeader: FC<MeaninglessHeaderProps> = ({
  showActions = false,
}) => {
  const router = useRouter();
  const unreadCount = useAtomValue(unreadCountAtom);

  return (
    <header className="flex h-[60px] w-full items-center justify-between px-6">
      <Link href="/" className="flex h-[3.625rem] cursor-pointer items-center">
        <img src="/brand/PillChat.svg" alt="logo" width={82} height={32} />
      </Link>

      {showActions && (
        <div className="flex h-[3.625rem] items-center gap-4">
          <button
            type="button"
            className="relative flex items-center"
            onClick={() => router.push("/notifications")}
            aria-label="알림"
          >
            <img src="/Bell.svg" alt="" width={32} height={32} />
            {unreadCount > 0 && (
              <span className="absolute right-0 top-2 h-2.5 w-2.5 rounded-full border-2 border-white bg-brand" />
            )}
          </button>
          <button
            type="button"
            className="flex items-center"
            onClick={() => router.push("/setting")}
            aria-label="설정"
          >
            <img src="/Setting.svg" alt="" width={32} height={32} />
          </button>
        </div>
      )}
    </header>
  );
};
