import { ComponentProps, forwardRef } from "react";
import { cn } from "@/lib/utils";
import { cva, VariantProps } from "class-variance-authority";

const inputVariants = cva(
  `flex h-14 w-full rounded-xl border border-gray-300 bg-card px-4 py-4 text-body-large text-foreground transition-colors file:border-0 file:bg-transparent file:text-body-large file:font-normal file:text-foreground placeholder:text-gray-500 disabled:cursor-not-allowed disabled:border-transparent disabled:bg-gray-100 disabled:text-gray-500 disabled:placeholder:text-gray-500`,
  {
    variants: {
      variant: {
        default: "",
        secondary: "border-transparent bg-gray-100 text-gray-800",
      },
    },
    defaultVariants: {
      variant: "default",
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
            ? "border-primary focus-visible:border-primary focus-visible:outline-none focus-visible:ring-0"
            : "focus-visible:border-2 focus-visible:border-foreground focus-visible:outline-none focus-visible:ring-0",
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
