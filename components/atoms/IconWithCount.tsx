import { FC } from "react";

import { cn } from "@/lib/utils";

export const IconWithCount: FC<{
  src: string;
  count: number;
  className?: string;
  countClassName?: string;
}> = ({ src, count, className, countClassName }) => {
  return (
    <span className={cn("flex flex-row items-center text-gray-500", className)}>
      <img src={src} alt="" aria-hidden="true" className="h-5 w-5" />
      <span className={cn("text-label-small", countClassName)}>{count}</span>
    </span>
  );
};
