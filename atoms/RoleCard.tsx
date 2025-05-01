import React from "react";

interface RoleCardProps {
  title: string;
  imageSrc: string;
}

export function RoleCard({ title, imageSrc }: RoleCardProps) {
  return (
    <div className="w-[140px] flex flex-col gap-[12px] items-center">
      <div className="w-full h-[180px] gap-[14px] rounded-[12px] border border-[#FF452E] flex flex-col items-center justify-center">
        <p className="font-[pretendard] font-semibold text-[20px]">{title}</p>
        <img src={imageSrc} alt={title} />
      </div>
    </div>
  );
}
