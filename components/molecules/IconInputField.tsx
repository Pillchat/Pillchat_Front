import { forwardRef, ChangeEvent } from "react";
import { IconInput } from "../atoms";

interface IconInputFieldProps {
  content: string;
  value?: string;
  disabled?: boolean;
  iconSrc?: string;
  iconAlt?: string;
  iconPosition?: "left" | "right";
  iconAsButton?: boolean;
  iconSize?: number;
  onIconClick?: () => void;

  placeholder?: string;
  autoFocus?: boolean;
  type?: string;
  maxLength?: number;
  minLength?: number;
  errorMessage?: string;

  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  onBlur?: () => void;
}

export const IconInputField = forwardRef<HTMLInputElement, IconInputFieldProps>(
  function IconInputField(
    {
      content,
      value,
      disabled,
      iconSrc,
      iconAlt,
      iconSize,
      iconAsButton,
      iconPosition = "right",
      onIconClick,
      placeholder,
      autoFocus,
      type = "text",
      maxLength,
      minLength,
      errorMessage,
      onChange,
      onBlur,
    },
    ref,
  ) {
    return (
      <div className="flex flex-col gap-[4px]">
        <p className="text-sm">{content}</p>

        <IconInput
          ref={ref}
          value={value ?? ""}
          disabled={disabled}
          type={type}
          iconSrc={iconSrc}
          iconAlt={iconAlt}
          iconSize={iconSize}
          iconAsButton={iconAsButton}
          iconPosition={iconPosition}
          onIconClick={onIconClick}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          autoFocus={autoFocus}
          maxLength={maxLength}
          minLength={minLength}
        />

        {errorMessage && (
          <p className="text-xs text-destructive">{errorMessage}</p>
        )}
      </div>
    );
  },
);
