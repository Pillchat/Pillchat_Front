"use client";

import { FC } from "react";
import Link from "next/link";

export const MeaninglessHeader: FC = () => {
  return (
    <>
      <header className="fixed left-1/2 top-0 z-50 flex h-[90px] w-full max-w-screen-sm -translate-x-1/2 items-center justify-between bg-white px-6 md:max-w-none">
        <Link href="/" className="flex h-full cursor-pointer items-center">
          <img src="/PillChat.svg" alt="logo" width={82} height={32} />
        </Link>
      </header>
      <div aria-hidden="true" className="h-[90px] shrink-0" />
    </>
  );
};
