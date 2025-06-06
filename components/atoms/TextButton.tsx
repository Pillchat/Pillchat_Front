import { ButtonSize, ButtonVariant } from "@/types";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";

export const TextButton = ({
  label,
  onClick,
  size = "default",
  variant = "default",
  className,
}: {
  label: string;
  onClick?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
}) => {
  return (
    <Button
      size={size}
      variant={variant}
      onClick={onClick}
      className={cn(className)}
    >
      {label}
    </Button>
  );
};
