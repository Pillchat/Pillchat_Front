import { ButtonHTMLAttributes, forwardRef } from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 touch-manipulation",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow active:bg-primary/90",
        disabled: "bg-muted text-muted-foreground",
        outline:
          "border border-teritary active:bg-accent active:text-primary active:border-primary",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm active:bg-secondary/70",
        teritary: "text-foreground font-medium active:bg-accent/50",
        ghost: "active:bg-accent active:text-accent-foreground",
        link: "text-primary underline-offset-4 active:underline",
        textOnly: "bg-none cursor-pointer active:opacity-70",
        brand: "bg-[#FF412E] text-white active:bg-[#FF412E]",
        "stroke-gray": "bg-white text-gray-500 border border-gray-500",
        "stroke-brand": "bg-white text-brand border border-brand",
      },
      size: {
        default: "h-[3.625rem] px-4 py-3",
        sm: "h-8 px-3 py-1 text-sm rounded-[1.25rem]",
        lg: "h-10 px-8",
        icon: "h-9 w-9",
        square: "h-11 w-11 rounded-xl px-5 py-4 text-sm",
        long: "h-11 w-[10.625rem] rounded-xl py-3 text-sm",
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
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size }), className)}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
