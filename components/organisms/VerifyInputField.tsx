import React from "react";
import { Input } from "../atoms/Input";

interface InputFieldProps {
  content: string;
  disabled?: boolean;
  value?: string;
  placeholder?: string;
  autoFocus?: boolean;
  maxLength?: number;
  minLength?: number;
  api?: () => void;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
}

export function VerifyInputField({
  content,
  disabled,
  value,
  placeholder,
  autoFocus,
  maxLength,
  minLength,
  api,
  onChange,
}: InputFieldProps) {
  return (
    <div className="flex flex-col gap-[4px]">
      <p className="font-regular font-[pretendard] text-[14px]">{content}</p>
      <div className="flex flex-row gap-[10px]">
        <div className="w-[70%]">
          <Input
            value={value}
            disabled={disabled}
            placeholder={placeholder}
            autoFocus={autoFocus}
            maxLength={maxLength}
            minLength={minLength}
            onChange={onChange}
          />
        </div>

        <button
          onClick={api}
          className="h-[52px] w-[30%] rounded-[12px] border border-[#FF412E] bg-white font-[pretendard] text-[#FF412E]"
        >
          재전송
        </button>
      </div>
    </div>
  );
}
