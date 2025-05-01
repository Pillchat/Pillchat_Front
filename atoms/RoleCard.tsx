import React from "react";

interface RoleCardProps {
  title: string;
  imageSrc: string;
}

export function RoleCard({ title, imageSrc }: RoleCardProps) {
  return (
    <div className="flex w-[140px] flex-col items-center gap-[12px]">
      <div className="flex h-[180px] w-full flex-col items-center justify-center gap-[14px] rounded-[12px] border border-[#FF452E]">
        <p className="font-[pretendard] text-[20px] font-semibold">{title}</p>
        <img src={imageSrc} alt={title} />
      </div>
    </div>
  );
}
