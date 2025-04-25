"use client";

import Image from "next/image";
import { FC } from "react";

export const Logo: FC = () => (
  <div className="flex flex-col items-center justify-center gap-3">
    <div>
      <Image
        src="/PillChat.svg"
        alt="PillChat logo"
        width={160}
        height={83}
        className="w-full"
      />
    </div>
    <div className="text-lg font-semibold text-primary tracking-tight">
      약대생을 위한 국내 유일 질문 처방전
    </div>
  </div>
);
