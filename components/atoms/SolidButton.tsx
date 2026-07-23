import { Button, ButtonProps } from "../ui/button";
import { cn } from "@/lib/utils";

export function SolidButton({
  content,
  variant = "brand",
  className,
  ...props
}: ButtonProps) {
  return (
    <Button
      variant={variant}
      {...props}
      className={cn(
        "h-[3.625rem] w-full rounded-xl px-4 py-3 text-label-large",
        (variant === "brand" || variant === "default") && "enabled:text-white",
        className,
      )}
    >
      {content}
    </Button>
  );
}
