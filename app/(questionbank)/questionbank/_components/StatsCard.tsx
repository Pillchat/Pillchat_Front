"use client";

import { cn } from "@/lib/utils";
import { PercentageBar } from "@/components/atoms/PercentageBar";
import { FC, ReactNode } from "react";

interface StatsCardProps {
  label: string;
  value: ReactNode;
  valueClassName?: string;
  percentage?: number;
  color?: "default" | "green" | "red" | "gray";
}

const colorMap = {
  default: "text-foreground",
  green: "text-green-500",
  red: "text-red-500",
  gray: "text-muted-foreground",
};

const StatsCard: FC<StatsCardProps> = ({
  label,
  value,
  valueClassName,
  percentage,
  color = "default",
}) => {
  return (
    <div className="flex min-w-0 flex-1 flex-col items-center rounded-xl bg-gray-50 px-3 py-3">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span
        className={cn(
          "mt-1 text-xl font-bold tabular-nums",
          colorMap[color],
          valueClassName,
        )}
      >
        {value}
      </span>
      {percentage != null && (
        <PercentageBar
          value={percentage}
          label={label}
          className="mt-2 w-4/5 max-w-32"
        />
      )}
    </div>
  );
};

export default StatsCard;
