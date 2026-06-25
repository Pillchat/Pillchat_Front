import { ChangeEvent, KeyboardEvent } from "react";

interface Options {
  placeholder?: string;
  type?: string;
  value?: string;
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  onKeyDown?: (e: KeyboardEvent<HTMLInputElement>) => void;
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
      className="h-[52px] w-full rounded-[12px] border border-input bg-card pl-[1rem] font-[pretendard] text-[15px] font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:border-gray-300 disabled:bg-muted disabled:text-gray-500"
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
