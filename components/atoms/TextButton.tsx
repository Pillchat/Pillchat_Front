import { ButtonSize, ButtonVariant } from "@/types";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

export const TextButton = ({
  label,
  onClick,
  size = "default",
  variant = "default",
  className,
  supportIcon,
  afterIcon,
}: {
  label: string;
  onClick?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  supportIcon?: ReactNode;
  afterIcon?: ReactNode;
}) => {
  return (
    <Button
      size={size}
      variant={variant}
      onClick={onClick}
      className={cn(className)}
    >
      {supportIcon && supportIcon}
      {label}
      {afterIcon && afterIcon}
    </Button>
  );
};
