"use client";

import { MeaninglessHeader, BottomNavbar } from "@/components/molecules";

const questionbank = () => {
  return (
    <div className="flex min-h-screen flex-col">
      <MeaninglessHeader />

      <div className="flex flex-1 flex-col items-center justify-center pb-[5.625rem] text-xl">
        <p>문제은행 준비 중입니다.</p>
        <p>기대해주세요.</p>
      </div>

      <BottomNavbar />
    </div>
  );
};

export default questionbank;
