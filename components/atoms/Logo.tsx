"use client";

import { PUBLIC_ASSETS } from "@/constants/assets";
import Image from "next/image";
import { FC } from "react";

export const Logo: FC = () => (
  <div className="flex flex-col items-center justify-center gap-3">
    <div>
      <Image
        src={PUBLIC_ASSETS.brand.pillchatLogo}
        alt="PillChat logo"
        width={160}
        height={83}
        className="w-full"
      />
    </div>
    <div className="text-lg font-semibold tracking-tight text-primary">
      약대생을 위한 국내 유일 질문 처방전
    </div>
  </div>
);
