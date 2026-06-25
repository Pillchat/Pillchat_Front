import { forwardRef, InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { Input } from "../ui/input";

interface IconInputProps extends InputHTMLAttributes<HTMLInputElement> {
  iconSrc?: string;
  iconAlt?: string;
  iconPosition?: "left" | "right";
  iconAsButton?: boolean;
  iconSize?: number;
  onIconClick?: () => void;
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
      className,
      ...inputProps
    },
    ref,
  ) {
    const IconWrapper = iconAsButton ? "button" : "div";
    const isLeft = iconPosition === "left";
    const iconPadding = isLeft ? "pl-10 pr-4" : "pl-4 pr-10";

    return (
      <div className="relative flex items-center">
        <Input
          ref={ref}
          {...inputProps}
          className={cn(
            `h-[52px] w-full ${iconPadding} rounded-[12px] border border-input bg-card pl-[1rem] font-[pretendard] text-[15px] font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:border-gray-300 disabled:bg-muted disabled:text-gray-500`,
            className,
          )}
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
      </div>
    );
  },
);
