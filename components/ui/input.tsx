import { ComponentProps, forwardRef } from "react";
import { cn } from "@/lib/utils";
import { cva, VariantProps } from "class-variance-authority";

const inputVariants = cva(
  `flex h-14 w-full rounded-xl border border-input bg-transparent px-3 py-4 text-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-normal file:text-foreground placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 md:text-sm`,
  {
    variants: {
      variant: {
        default: "",
        secondary: "bg-secondary text-border border-none",
      },
      defaultVariants: {
        variant: "default",
      },
    },
  },
);

export interface InputProps
  extends ComponentProps<"input">,
    VariantProps<typeof inputVariants> {
  asChild?: boolean;
  error?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, variant, type, error, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          inputVariants({ variant }),
          error
            ? "border-destructive focus-visible:outline-none focus-visible:ring-0"
            : "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
