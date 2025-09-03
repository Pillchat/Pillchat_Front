"use client";

import { FC } from "react";
import Link from "next/link";

export const MeaninglessHeader: FC = () => {
  return (
    <header className="flex w-full items-center justify-between px-6 py-4">
      <Link href="/" className="flex h-[3.625rem] cursor-pointer items-center">
        <img src="/PillChat.svg" alt="logo" width={82} height={32} />
      </Link>
    </header>
  );
};
