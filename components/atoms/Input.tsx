import { ChangeEvent, KeyboardEvent } from "react";
import { cn } from "@/lib/utils";

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
  className?: string;
  error?: boolean;
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
  className,
  error,
}: Options) {
  return (
    <input
      className={cn(
        "h-14 w-full rounded-xl border border-gray-300 bg-card px-4 text-body-large text-foreground placeholder:text-gray-500 focus:border-2 focus:border-foreground focus:outline-none disabled:border-transparent disabled:bg-gray-100 disabled:text-gray-500",
        error && "border-primary focus:border-primary",
        className,
      )}
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
