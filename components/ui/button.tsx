import { ButtonHTMLAttributes, forwardRef } from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";
import { PillLoader } from "../atoms/PillLoader";

const buttonVariants = cva(
  "inline-flex touch-manipulation items-center justify-center gap-0 whitespace-nowrap rounded-xl text-label-large transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:bg-gray-100 disabled:text-gray-500 [&_svg]:pointer-events-none [&_svg]:size-8 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-primary-800 active:bg-primary-800",
        disabled: "pointer-events-none bg-gray-100 text-gray-500",
        outline:
          "border border-gray-500 bg-card text-foreground active:bg-gray-100",
        secondary:
          "border border-primary bg-card text-primary active:bg-primary-980",
        teritary:
          "border border-gray-500 bg-card text-foreground active:bg-gray-100",
        ghost: "active:bg-primary-980 active:text-accent-foreground",
        link: "text-primary underline-offset-4 active:underline",
        textOnly: "cursor-pointer bg-transparent active:opacity-70",
        brand:
          "bg-primary text-primary-foreground hover:bg-primary-800 active:bg-primary-800",
        "stroke-gray": "border border-gray-500 bg-card text-foreground",
        "stroke-brand": "border border-primary bg-card text-primary",
      },
      size: {
        default: "h-[3.625rem] px-4 py-3",
        sm: "h-8 rounded-xl px-3 py-1 text-label-medium [&_svg]:size-5",
        lg: "h-[3.625rem] px-8",
        icon: "h-9 w-9",
        square:
          "h-11 w-11 rounded-xl px-5 py-4 text-label-medium [&_svg]:size-6",
        long: "h-[3.625rem] w-[10.625rem] rounded-xl py-3 text-label-large",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      loading = false,
      children,
      disabled,
      ...props
    },
    ref,
  ) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size }), className)}
        ref={ref}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        {...props}
      >
        {asChild ? (
          children
        ) : (
          <>
            {loading && <PillLoader size={24} className="mr-2" decorative />}
            {children}
          </>
        )}
      </Comp>
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
