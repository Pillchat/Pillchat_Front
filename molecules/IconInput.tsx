import React, { useState } from "react";

interface InputWithImageIconProps {
  iconSrc?: string;
  iconAlt?: string;
  iconPosition?: "left" | "right";
  iconAsButton?: boolean;
  onIconClick?: () => void;
  placeholder?: string;
  type?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

export function IconInput({
  iconSrc,
  iconAlt = "icon",
  iconPosition = "left",
  iconAsButton = false,
  onIconClick,
  placeholder = "",
  type = "text",
  value,
  onChange,
  onKeyDown,
}: InputWithImageIconProps) {
  const isLeft = iconPosition === "left";
  const iconPadding = isLeft ? "pl-10 pr-4" : "pl-4 pr-10";
  const iconPositionStyle = isLeft ? "left-3" : "right-5";

  return (
    <div className="relative w-full">
      <input
        type={type}
        value={value}
        onChange={onChange}
        className={`w-full h-[56px] ${iconPadding} py-2 rounded-[8px] focus:outline-[#C4C4C4] focus:ring-1 focus:ring-black bg-[#F2F4F7] placeholder:color-[#C4C4C4]`}
        placeholder={placeholder}
        onKeyDown={onKeyDown}
      />

      {iconSrc &&
        (iconAsButton ? (
          <button
            type="button"
            onClick={onIconClick}
            className={`absolute top-1/2 ${iconPositionStyle} -translate-y-1/2`}
          >
            <img src={iconSrc} alt={iconAlt} className="w-5 h-5" />
          </button>
        ) : (
          <div
            className={`absolute top-1/2 ${iconPositionStyle} -translate-y-1/2 pointer-events-none`}
          >
            <img src={iconSrc} alt={iconAlt} className="w-5 h-5" />
          </div>
        ))}
    </div>
  );
}
