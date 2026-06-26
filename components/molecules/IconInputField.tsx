import { forwardRef, ChangeEvent, InputHTMLAttributes } from "react";
import { IconInput } from "../atoms";

interface IconInputFieldProps {
  content: string;
  value?: string;
  disabled?: boolean;
  labelClassName?: string;
  inputClassName?: string;
  iconSrc?: string;
  iconAlt?: string;
  iconPosition?: "left" | "right";
  iconAsButton?: boolean;
  iconSize?: number;
  clearable?: boolean;
  onIconClick?: () => void;

  placeholder?: string;
  autoFocus?: boolean;
  type?: string;
  inputMode?: InputHTMLAttributes<HTMLInputElement>["inputMode"];
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
      labelClassName,
      inputClassName,
      iconSrc,
      iconAlt,
      iconSize,
      iconAsButton,
      clearable = true,
      iconPosition = "right",
      onIconClick,
      placeholder,
      autoFocus,
      type = "text",
      inputMode,
      maxLength,
      minLength,
      errorMessage,
      onChange,
      onBlur,
    },
    ref,
  ) {
    const showError = !!errorMessage;
    const handleClear = () => {
      if (!onChange) return;

      onChange({
        target: { value: "" },
        currentTarget: { value: "" },
      } as ChangeEvent<HTMLInputElement>);
    };

    return (
      <div className="flex flex-col gap-1">
        <p className={labelClassName ?? "text-title-small text-foreground"}>
          {content}
        </p>

        <IconInput
          ref={ref}
          value={value ?? ""}
          disabled={disabled}
          className={inputClassName}
          error={showError}
          type={type}
          inputMode={inputMode}
          iconSrc={iconSrc}
          iconAlt={iconAlt}
          iconSize={iconSize}
          iconAsButton={iconAsButton}
          iconPosition={iconPosition}
          onIconClick={onIconClick}
          clearable={clearable}
          onClear={handleClear}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          autoFocus={autoFocus}
          maxLength={maxLength}
          minLength={minLength}
        />

        {errorMessage && (
          <p className="text-label-small text-primary">{errorMessage}</p>
        )}
      </div>
    );
  },
);
