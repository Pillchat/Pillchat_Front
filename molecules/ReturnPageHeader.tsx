import React from "react";

interface AsClick {
  onIconClick?: () => void;
  content: string;
}

function Name({ content }) {
  return <p className="font-[pretendard] text-[16px] font-bold">{content}</p>;
}

export function ReturnHeader({ content, onIconClick }: AsClick) {
  return (
    <div className="flex h-[60px] w-full flex-row items-center justify-center">
      <img
        src="/ReturnPage.svg"
        className="absolute left-5 h-6 w-6"
        onClick={onIconClick}
      />
      <Name content={content} />
    </div>
  );
}
