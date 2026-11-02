import { cn } from "@/lib/utils";

export function PercentageBar({
  value,
  label,
  className,
}: {
  value?: number | null;
  label: string;
  className?: string;
}) {
  if (value == null || !Number.isFinite(value)) return null;

  return (
    <progress
      aria-label={label}
      max={100}
      value={Math.min(100, Math.max(0, value))}
      className={cn(
        "block h-1.5 w-full appearance-none overflow-hidden rounded-full bg-primary-900/50 [&::-moz-progress-bar]:rounded-full [&::-moz-progress-bar]:bg-primary [&::-webkit-progress-bar]:rounded-full [&::-webkit-progress-bar]:bg-primary-900/50 [&::-webkit-progress-value]:rounded-full [&::-webkit-progress-value]:bg-primary",
        className,
      )}
    />
  );
}
