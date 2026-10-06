"use client";

import { FC } from "react";
import { CustomHeader } from "@/components/molecules";

const gradeInfo: FC = () => {
  return (
    <div className="flex min-h-dvh flex-col items-center">
      <CustomHeader title="등급 상세정보" />

      <div className="flex w-[90%] flex-col gap-8">
        <div className="flex flex-col gap-3">
          <div className="flex flex-row items-center gap-3">
            <div className="flex h-[1.375rem] w-auto items-center justify-end rounded-full bg-[#00C922] px-8 py-5 text-lg text-white">
              1일
            </div>
            <p>첫 출석을 시작했어요!</p>
          </div>

          <p className="pl-8 text-muted-foreground">· 누적 출석 1일 이상</p>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex flex-row items-center gap-3">
            <div className="flex h-[1.375rem] w-auto items-center justify-end rounded-full bg-[#FF49B9] px-8 py-5 text-lg text-white">
              20일
            </div>
            <p>차곡차곡 20일 출석을 쌓았어요!</p>
          </div>

          <p className="pl-8 text-muted-foreground">· 누적 출석 20일 이상</p>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex flex-row items-center gap-3">
            <div className="flex h-[1.375rem] w-auto items-center justify-end rounded-full bg-[#FFD000] px-8 py-5 text-lg text-white">
              50일
            </div>
            <p>50일 연속으로 출석했어요!</p>
          </div>

          <p className="pl-8 text-muted-foreground">· 연속 출석 50일 이상</p>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex flex-row items-center gap-3">
            <div className="flex h-[1.375rem] w-auto items-center justify-end rounded-full bg-brand px-8 py-5 text-lg text-white">
              100일
            </div>
            <p>100일 연속으로 출석했어요!</p>
          </div>

          <p className="pl-8 text-muted-foreground">· 연속 출석 100일 이상</p>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex flex-row items-center gap-3">
            <div className="flex h-[1.375rem] w-auto items-center justify-end rounded-full bg-[#800C00] px-8 py-5 text-lg text-white">
              365일
            </div>
            <p>365일 연속으로 출석했어요!</p>
          </div>

          <p className="pl-8 text-muted-foreground">· 연속 출석 365일 이상</p>
        </div>
      </div>
    </div>
  );
};

export default gradeInfo;
