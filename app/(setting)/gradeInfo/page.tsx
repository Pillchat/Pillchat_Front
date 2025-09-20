"use client";

import { FC } from "react";
import { CustomHeader } from "@/components/molecules";

const gradeInfo: FC = () => {
  return (
    <div className="flex min-h-screen flex-col items-center">
      <CustomHeader title="등급 상세정보" />

      <div className="flex w-[90%] flex-col gap-8">
        <div className="flex flex-col gap-3">
          <div className="flex flex-row items-center gap-3">
            <div className="flex h-[1.375rem] w-auto items-center justify-end rounded-full bg-[#00C922] px-8 py-5 text-lg text-white">
              새싹
            </div>
            <p>삐약삐약! 자라나는 필챗 어린이!</p>
          </div>

          <p className="pl-8 text-muted-foreground">
            · 질문 1개 이상 또는 답변 1개 이상
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex flex-row items-center gap-3">
            <div className="flex h-[1.375rem] w-auto items-center justify-end rounded-full bg-[#FF49B9] px-8 py-5 text-lg text-white">
              한알
            </div>
            <p>적응완료한 성장기의 필챗터!</p>
          </div>

          <p className="pl-8 text-muted-foreground">
            · 질문 5개 이상 또는 답변 5개 이상
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex flex-row items-center gap-3">
            <div className="flex h-[1.375rem] w-auto items-center justify-end rounded-full bg-[#FFD000] px-8 py-5 text-lg text-white">
              두알
            </div>
            <p>필챗생활은 익숙해! 열심히 활동하는 필챗터!</p>
          </div>

          <p className="pl-8 text-muted-foreground">
            · 질문 15개 이상 또는 답변 15개 이상
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex flex-row items-center gap-3">
            <div className="flex h-[1.375rem] w-auto items-center justify-end rounded-full bg-brand px-8 py-5 text-lg text-white">
              고수
            </div>
            <p>필챗생활은 완벽해! 뭐든지 잘하는 고수!</p>
          </div>

          <p className="pl-8 text-muted-foreground">
            · 질문 및 답변 합산 40개 이상
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex flex-row items-center gap-3">
            <div className="flex h-[1.375rem] w-auto items-center justify-end rounded-full bg-[#800C00] px-8 py-5 text-lg text-white">
              명약
            </div>
            <p>필챗의 전설! 필챗의 레전드!</p>
          </div>

          <p className="pl-8 text-muted-foreground">
            · 질문 및 답변 합산 100개 이상
          </p>
        </div>
      </div>
    </div>
  );
};

export default gradeInfo;
