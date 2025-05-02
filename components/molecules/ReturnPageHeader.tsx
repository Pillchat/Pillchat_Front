import React from "react";

interface AsClick {
  onIconClick?: () => void;
  content: string;
  dark?: boolean;
}

function Name({ content, dark }: { content: string; dark?: boolean }) {
  return (
    <p
      className={`font-[pretendard] text-[16px] font-bold ${
        dark ? "text-white" : "text-black"
      }`}
    >
      {content}
    </p>
  );
}

export function ReturnHeader({ content, onIconClick, dark }: AsClick) {
  return (
    <div className="relative flex h-[60px] w-full flex-row items-center justify-center">
      <img
        src={dark ? "/ReturnPage-white.svg" : "/ReturnPage.svg"}
        className="absolute left-5 h-6 w-6 cursor-pointer"
        onClick={onIconClick}
        alt="뒤로가기"
      />
      <Name content={content} dark={dark} />
    </div>
  );
}
