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
  loading = false,
}: {
  label: ReactNode;
  onClick?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  supportIcon?: ReactNode;
  afterIcon?: ReactNode;
  loading?: boolean;
}) => {
  return (
    <Button
      size={size}
      variant={variant}
      onClick={onClick}
      className={cn(className)}
      loading={loading}
    >
      {supportIcon}
      {label}
      {afterIcon}
    </Button>
  );
};
