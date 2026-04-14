import { Button, ButtonProps } from "../ui/button";

export function SolidButton({
  content,
  variant = "brand",
  ...props
}: ButtonProps) {
  return (
    <Button
      variant={variant}
      {...props}
      className="h-[52px] w-full rounded-xl px-4 py-2 text-[1.125rem] font-medium"
    >
      {content}
    </Button>
  );
}
