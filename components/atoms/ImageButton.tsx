import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { FC } from "react";

export const ImageButton: FC<{ className?: string }> = ({ className }) => {
  return (
    <div
      className={cn(
        "flex h-[3.75rem] w-[3.75rem] flex-col items-center justify-center gap-1 rounded-md bg-secondary",
        className,
      )}
    >
      <Button variant="textOnly" size="icon" className="h-5 w-5">
        <img src="/Camera_muted.svg" alt="camera" width={20} height={20} />
      </Button>
      <p className="text-xs font-medium text-border">0 / 10</p>
    </div>
  );
};
