import { cn } from "@/lib/utils";
import { FC } from "react";
import { InputProps } from "../ui/input";

export const RoundedInput: FC<InputProps> = ({
  value,
  onChange,
  onKeyDown,
  onBlur,
  autoFocus = true,
  className,
  ...props
}) => {
  return (
    <input
      type="text"
      value={value}
      onChange={onChange}
      onKeyDown={onKeyDown}
      onBlur={onBlur}
      className={cn(
        "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent",
        "border border-primary bg-accent text-primary",
        "h-8 rounded-[1.25rem] px-3 py-1 text-sm",
        "w-auto",
        className,
      )}
      autoFocus={autoFocus}
      {...props}
    />
  );
};
