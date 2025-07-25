import React from "react";

interface Options {
  placeholder?: string;
  type?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  autoFocus?: boolean;
  maxLength?: number;
  minLength?: number;
}

export function Input({
  placeholder,
  type,
  value,
  onChange,
  onKeyDown,
  disabled,
  autoFocus,
  maxLength,
  minLength,
}: Options) {
  return (
    <input
      className="h-[52px] w-full rounded-[12px] border border-[#C4C4C4] bg-white pl-[1rem] font-[pretendard] text-[15px] font-medium"
      placeholder={placeholder}
      type={type}
      value={value}
      onChange={onChange}
      onKeyDown={onKeyDown}
      disabled={disabled}
      autoFocus={autoFocus}
      maxLength={maxLength}
      minLength={minLength}
    />
  );
}
