"use client";

import { cn } from "@/lib/utils";
import { FC, ReactNode } from "react";

interface StatsCardProps {
  label: string;
  value: ReactNode;
  color?: "default" | "green" | "red" | "gray";
}

const colorMap = {
  default: "text-foreground",
  green: "text-green-500",
  red: "text-red-500",
  gray: "text-muted-foreground",
};

const StatsCard: FC<StatsCardProps> = ({ label, value, color = "default" }) => {
  return (
    <div className="flex min-w-0 flex-1 flex-col items-center rounded-xl bg-gray-50 px-3 py-3">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span
        className={cn("mt-1 text-xl font-bold tabular-nums", colorMap[color])}
      >
        {value}
      </span>
    </div>
  );
};

export default StatsCard;
