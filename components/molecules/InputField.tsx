import { ChangeEvent, KeyboardEvent } from "react";
import { TextField } from "../atoms/TextField";

export interface InputFieldProps {
  content: string;
  disabled?: boolean;
  placeholder?: string;
  type?: string;
  value?: string;
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  onKeyDown?: (e: KeyboardEvent<HTMLInputElement>) => void;
  autoFocus?: boolean;
  maxLength?: number;
  minLength?: number;
  helperText?: string;
  errorMessage?: string;
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
  helperText,
  errorMessage,
}: InputFieldProps) {
  return (
    <TextField
      label={content}
      disabled={disabled}
      placeholder={placeholder}
      type={type}
      value={value}
      onChange={onChange}
      onKeyDown={onKeyDown}
      autoFocus={autoFocus}
      maxLength={maxLength}
      minLength={minLength}
      helperText={helperText}
      errorMessage={errorMessage}
    />
  );
}
