import React from "react";
import { IconInput } from "../atoms/IconInput";

interface InputFieldProps {
  content: string;
  disabled?: boolean;
  inputValue?: string;
  iconSrc?: string;
  iconAlt?: string;
  iconPosition?: "left" | "right";
  iconAsButton?: boolean;
  iconSize?: string;
  placeholder?: string;
  autoFocus?: boolean;
  type?: string;
  maxLength?: number;
  minLength?: number;
  onIconClick?: () => void;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function IconInputField({
  content,
  disabled,
  inputValue,
  iconSrc,
  iconAlt,
  iconSize,
  iconAsButton,
  iconPosition,
  onIconClick,
  onChange,
  placeholder,
  autoFocus,
  type,
  maxLength,
  minLength,
}: InputFieldProps) {
  return (
    <div className="flex flex-col gap-[4px]">
      <p className="font-regular font-[pretendard] text-[14px]">{content}</p>
      <IconInput
        disabled={disabled}
        value={inputValue}
        iconSrc={iconSrc}
        iconAlt={iconAlt}
        iconSize={iconSize}
        iconAsButton={iconAsButton}
        iconPosition={iconPosition}
        onIconClick={onIconClick}
        onChange={onChange}
        placeholder={placeholder}
        autoFocus={autoFocus}
        type={type}
        maxLength={maxLength}
        minLength={minLength}
      />
    </div>
  );
}
