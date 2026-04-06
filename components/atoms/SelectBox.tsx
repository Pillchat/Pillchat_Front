import { ChangeEvent } from "react";
import { cn } from "@/lib/utils";

interface IOption {
  key: number | string;
  value: string;
}

interface ISelectBoxProps {
  label?: string;
  options: IOption[];
  selectedValue: string;
  placeholder?: string;
  disabled: boolean;
  handleChange: (e: ChangeEvent<HTMLSelectElement>) => void;
  onClick?: () => void;
  labelClassName?: string;
  selectClassName?: string;
}

export function SelectBox({
  label,
  options,
  selectedValue,
  placeholder,
  disabled,
  handleChange,
  onClick,
  labelClassName,
  selectClassName,
}: ISelectBoxProps) {
  return (
    <div className="relative">
      {label && (
        <label className={cn("text-xs", labelClassName)}>{label}</label>
      )}
      <div>
        <select
          className={cn(
            "h-12 w-full appearance-none rounded-lg border bg-transparent px-3 py-3 focus:outline-none",
            selectClassName,
          )}
          value={selectedValue}
          disabled={disabled}
          onChange={handleChange}
          // onMouseDown={(e) => e.preventDefault()}
        >
          <option value="" disabled hidden>
            {placeholder}
          </option>
          {options.map((option) => (
            <option
              key={`select_${option.key}_${option.value}`}
              value={option.value}
              data-name={option.value}
            >
              {option.value}
            </option>
          ))}
        </select>
        <div className="absolute inset-0 cursor-pointer" onClick={onClick} />
        <span className="absolute bottom-4 right-4 ...">
          <img
            src="/ArrowIcon.svg"
            alt="arrow-left"
            width={16}
            height={16}
            className="rotate-90"
          />
        </span>
      </div>
    </div>
  );
}
