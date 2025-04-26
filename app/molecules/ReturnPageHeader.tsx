import React from "react";

interface AsClick {
  onIconClick?: () => void;
  content: string;
}

function Name({ content }) {
  return <p className="font-[pretendard] font-bold text-[16px]">{content}</p>;
}

export function ReturnHeader({ content, onIconClick }: AsClick) {
  return (
    <div className="w-full h-[60px] flex flex-row justify-center items-center">
      <img
        src="/ReturnPage.svg"
        className="absolute left-5 w-6 h-6"
        onClick={onIconClick}
      />
      <Name content={content} />
    </div>
  );
}
