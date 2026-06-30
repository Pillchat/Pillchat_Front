import React from "react";

interface RoleCardProps {
  title: string;
  imageSrc: string;
  onClick: () => void;
}

export function RoleCard({ title, imageSrc, onClick }: RoleCardProps) {
  return (
    <div
      className="flex w-[165px] flex-col items-center justify-center gap-[12px]"
      onClick={onClick}
    >
      <div className="flex h-[210px] w-full flex-col items-center justify-center gap-[18px] rounded-[12px] border border-primary">
        <p className="font-[pretendard] text-[22px] font-semibold">{title}</p>
        <img src={imageSrc} alt={title} className="h-[120px] pr-2" />
      </div>
    </div>
  );
}
