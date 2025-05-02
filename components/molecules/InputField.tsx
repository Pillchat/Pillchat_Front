import React from "react";
import { Input } from "../atoms/Input";

interface InputFieldProps {
  content: string;
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

export function InputField({
  content,
  placeholder,
  type,
  value,
  onChange,
  onKeyDown,
  disabled,
  autoFocus,
  maxLength,
  minLength,
}: InputFieldProps) {
  return (
    <div className="flex flex-col gap-[4px]">
      <p>{content}</p>
      <Input
        placeholder={placeholder}
        type={type}
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        disabled={disabled}
        autoFocus={autoFocus}
        maxLength={maxLength}
      />
    </div>
  );
}
