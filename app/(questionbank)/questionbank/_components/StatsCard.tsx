"use client";

import { cn } from "@/lib/utils";
import { FC } from "react";

interface StatsCardProps {
  label: string;
  value: number;
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
    <div className="flex flex-1 flex-col items-center rounded-xl bg-gray-50 px-3 py-3">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={cn("mt-1 text-xl font-bold", colorMap[color])}>
        {value}
      </span>
    </div>
  );
};

export default StatsCard;
