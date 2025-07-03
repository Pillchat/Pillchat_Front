import * as React from "react";

import { cn } from "@/lib/utils";

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[60px] w-full rounded-xl border border-input bg-transparent px-3 py-4 text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className,
      )}
      ref={ref}
      onInput={(e) => {
        const target = e.target as HTMLTextAreaElement;
        target.style.height = "0px";
        target.style.height = target.scrollHeight + "px";
      }}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";

export { Textarea };
