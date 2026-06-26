import { ChangeEvent, ComponentProps, FC, useId } from "react";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";

import { Input } from "../ui/input";

type TextFieldProps = Omit<ComponentProps<typeof Input>, "error"> & {
  label?: string;
  helperText?: string;
  errorMessage?: string;
  clearable?: boolean;
  inputClassName?: string;
};

const createClearEvent = (
  currentTarget: HTMLInputElement,
): ChangeEvent<HTMLInputElement> =>
  ({
    target: currentTarget,
    currentTarget,
  }) as ChangeEvent<HTMLInputElement>;

export const TextField: FC<TextFieldProps> = ({
  id,
  label,
  helperText,
  errorMessage,
  clearable = true,
  disabled,
  value,
  onChange,
  className,
  inputClassName,
  ...props
}) => {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const hasValue = typeof value === "string" ? value.length > 0 : !!value;
  const showClear = clearable && hasValue && !disabled && !!onChange;
  const helper = errorMessage ?? helperText;

  const handleClear = () => {
    const input = document.getElementById(inputId) as HTMLInputElement | null;
    if (!input || !onChange) return;

    input.value = "";
    onChange(createClearEvent(input));
    input.focus();
  };

  return (
    <div className={cn("flex w-full flex-col gap-1", className)}>
      {label && (
        <label htmlFor={inputId} className="text-title-small text-foreground">
          {label}
        </label>
      )}

      <div className="relative">
        <Input
          id={inputId}
          disabled={disabled}
          value={value}
          onChange={onChange}
          error={!!errorMessage}
          className={cn(showClear && "pr-11", inputClassName)}
          {...props}
        />
        {showClear && (
          <button
            type="button"
            aria-label="입력 내용 지우기"
            onClick={handleClear}
            className="absolute right-3 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full bg-gray-300 text-primary-foreground active:scale-95"
          >
            <X aria-hidden="true" className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {helper && (
        <p
          className={cn(
            "text-label-small",
            errorMessage ? "text-primary" : "text-foreground",
          )}
        >
          {helper}
        </p>
      )}
    </div>
  );
};
