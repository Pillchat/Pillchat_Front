import { Button, ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface StrokeBtnProps extends Omit<ButtonProps, "variant"> {
  content: string;
  variant?: "stroke-gray" | "stroke-brand";
}

export function StrokeButton({
  content,
  variant = "stroke-gray",
  className,
  ...props
}: StrokeBtnProps) {
  return (
    <Button
      variant={variant}
      {...props}
      className={cn(
        "h-[3.625rem] w-full rounded-xl bg-card px-4 py-3 text-label-large",
        className,
      )}
    >
      {content}
    </Button>
  );
}
