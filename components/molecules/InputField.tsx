import React from "react";
import { Input } from "../atoms/Input";

export interface InputFieldProps {
  content: string;
  disabled?: boolean;
  placeholder?: string;
  type?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  autoFocus?: boolean;
  maxLength?: number;
  minLength?: number;
}

export function InputField({
  content,
  disabled,
  placeholder,
  type,
  value,
  onChange,
  onKeyDown,
  autoFocus,
  maxLength,
  minLength,
}: InputFieldProps) {
  return (
    <div className="flex flex-col gap-[4px]">
      <p>{content}</p>
      <Input
        disabled={disabled}
        placeholder={placeholder}
        type={type}
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        autoFocus={autoFocus}
        maxLength={maxLength}
        minLength={minLength}
      />
    </div>
  );
}
