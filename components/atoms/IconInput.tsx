"use client";

import { forwardRef, InputHTMLAttributes, useCallback, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "../ui/input";

interface IconInputProps extends InputHTMLAttributes<HTMLInputElement> {
  iconSrc?: string;
  iconAlt?: string;
  iconPosition?: "left" | "right";
  iconAsButton?: boolean;
  iconSize?: number;
  onIconClick?: () => void;
  error?: boolean;
  clearable?: boolean;
  onClear?: () => void;
}

export const IconInput = forwardRef<HTMLInputElement, IconInputProps>(
  function IconInput(
    {
      iconSrc,
      iconAlt,
      iconPosition = "right",
      iconAsButton,
      iconSize = 20,
      onIconClick,
      error,
      clearable,
      onClear,
      className,
      value,
      ...inputProps
    },
    ref,
  ) {
    const inputRef = useRef<HTMLInputElement>(null);
    const IconWrapper = iconAsButton ? "button" : "div";
    const isLeft = iconPosition === "left";
    const hasValue = typeof value === "string" ? value.length > 0 : !!value;
    const showClear =
      clearable &&
      hasValue &&
      !inputProps.disabled &&
      !iconSrc &&
      !!inputProps.onChange &&
      !!onClear;
    const iconPadding = isLeft
      ? "pl-10 pr-4"
      : showClear || iconSrc
        ? "pr-10"
        : "";
    const setInputRef = useCallback(
      (node: HTMLInputElement | null) => {
        inputRef.current = node;

        if (typeof ref === "function") {
          ref(node);
        } else if (ref) {
          ref.current = node;
        }
      },
      [ref],
    );

    const handleClear = () => {
      onClear?.();
      inputRef.current?.focus();
    };

    return (
      <div className="relative flex items-center">
        <Input
          ref={setInputRef}
          {...inputProps}
          value={value}
          error={error}
          className={cn(iconPadding, className)}
        />

        {iconSrc && (
          <IconWrapper
            type="button"
            onClick={iconAsButton ? onIconClick : undefined}
            className="absolute right-3 flex items-center"
          >
            <img
              src={iconSrc}
              alt={iconAlt}
              className={`w-[${iconSize}px] h-[${iconSize}px]`}
            />
          </IconWrapper>
        )}

        {showClear && (
          <button
            type="button"
            aria-label="입력 내용 지우기"
            onMouseDown={(event) => event.preventDefault()}
            onClick={handleClear}
            className="absolute right-1 flex h-10 w-10 items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-95"
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-300 text-primary-foreground">
              <X aria-hidden="true" className="h-3.5 w-3.5" />
            </span>
          </button>
        )}
      </div>
    );
  },
);
