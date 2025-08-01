import { Button, ButtonProps } from "@/components/ui/button";

interface StrokeBtnProps extends Omit<ButtonProps, "variant"> {
  content: string;
  variant?: "stroke-gray" | "stroke-brand";
}

export function StrokeButton({
  content,
  variant = "stroke-gray",
  ...props
}: StrokeBtnProps) {
  return (
    <Button
      variant={variant}
      {...props}
      className="h-[52px] w-full rounded-xl bg-white text-[1.125rem] font-medium"
    >
      {content}
    </Button>
  );
}
