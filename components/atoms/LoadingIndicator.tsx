import { cn } from "@/lib/utils";
import { PillLoader } from "./PillLoader";

interface LoadingIndicatorProps {
  label?: string;
  className?: string;
  inline?: boolean;
}

export function LoadingIndicator({
  label = "불러오는 중...",
  className,
  inline = false,
}: LoadingIndicatorProps) {
  return (
    <span
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={cn(
        "items-center justify-center text-sm",
        inline
          ? "inline-flex gap-2 text-inherit [font-size:inherit]"
          : "flex flex-col gap-2 py-8 text-muted-foreground",
        className,
      )}
    >
      <PillLoader size={inline ? 24 : 64} decorative />
      <span>{label}</span>
    </span>
  );
}
