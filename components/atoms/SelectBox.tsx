import { ChangeEvent } from "react";

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
}

export function SelectBox({
  label,
  options,
  selectedValue,
  placeholder,
  disabled,
  handleChange,
  onClick,
}: ISelectBoxProps) {
  return (
    <div className="relative">
      {label && <label className="text-xs">{label}</label>}
      <div>
        <select
          className="h-12 w-full appearance-none rounded-lg border border-[] bg-none px-3 py-3"
          value={selectedValue}
          disabled
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
