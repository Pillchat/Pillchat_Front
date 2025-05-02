import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

export function RoundedCheckbox({
  id,
  className,
}: {
  id: string;
  className?: string;
}) {
  return (
    <Checkbox
      id={id}
      className={cn(
        "h-full w-full rounded-full border-[1.5px] border-border data-[state=checked]:border-primary data-[state=checked]:bg-primary",
        className,
      )}
    />
  );
}
