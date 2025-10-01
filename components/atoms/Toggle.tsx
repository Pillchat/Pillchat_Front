"use client";

import { FC, useEffect, useState, KeyboardEvent } from "react";

interface ToggleProps {
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (next: boolean) => void;
  disabled?: boolean;
  ariaLabel?: string;
  size?: "sm" | "md" | "lg";
}

export const Toggle: FC<ToggleProps> = ({
  checked,
  defaultChecked = false,
  onChange,
  disabled = false,
  ariaLabel = "토글",
  size = "md",
}) => {
  const isControlled = typeof checked === "boolean";
  const [internal, setInternal] = useState<boolean>(defaultChecked);

  useEffect(() => {
    if (isControlled) setInternal(checked as boolean);
  }, [checked, isControlled]);

  const handleToggle = () => {
    if (disabled) return;
    const next = !internal;
    if (!isControlled) setInternal(next);
    onChange?.(next);
  };

  const handleKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      handleToggle();
    }
  };

  // size별 설정
  const sizeMap = {
    sm: {
      wrapWidth: 40,
      wrapHeight: 18,
      wrapPadding: 2,
      wrapRounded: 12,
      knobWidth: 14,
      knobHeight: 14,
      knobRounded: 7,
    },
    md: {
      wrapWidth: 50,
      wrapHeight: 28,
      wrapPadding: 3,
      wrapRounded: 16,
      knobWidth: 20,
      knobHeight: 20,
      knobRounded: 10,
    },
    lg: {
      wrapWidth: 60,
      wrapHeight: 28,
      wrapPadding: 3,
      wrapRounded: 20,
      knobWidth: 20,
      knobHeight: 20,
      knobRounded: 10,
    },
  } as const;

  const s = sizeMap[size];

  // translateX 계산
  const translateX = internal
    ? s.wrapWidth - s.knobWidth - s.wrapPadding * 2
    : 0;

  return (
    <button
      type="button"
      role="switch"
      aria-checked={internal}
      aria-label={ariaLabel}
      onClick={handleToggle}
      onKeyDown={handleKey}
      disabled={disabled}
      className={`relative inline-flex items-center transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
        disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"
      }`}
      style={{
        width: s.wrapWidth,
        height: s.wrapHeight,
      }}
    >
      {/* 트랙 */}
      <span
        className={`flex items-center transition-colors duration-200 ${
          internal ? 'bg-brand' : 'bg-muted-foreground'
        }`}
        style={{
          width: s.wrapWidth,
          height: s.wrapHeight,
          padding: s.wrapPadding,
          borderRadius: s.wrapRounded,
        }}
      >
        {/* knob */}
        <span
          className="bg-white shadow-sm transition-transform duration-200"
          style={{
            width: s.knobWidth,
            height: s.knobHeight,
            borderRadius: s.knobRounded,
            transform: `translateX(${translateX}px)`,
          }}
        />
      </span>
    </button>
  );
};