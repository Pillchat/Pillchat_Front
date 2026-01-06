import { forwardRef, InputHTMLAttributes } from "react";
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
          className={`h-[52px] w-full ${iconPadding} rounded-[12px] border border-[#C4C4C4] pl-[1rem] font-[pretendard] text-[15px] font-medium focus:outline-none focus:ring-1 focus:ring-black`}
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
