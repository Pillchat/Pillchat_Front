"use client";

import { FC } from "react";

interface DonutChartProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
}

const DonutChart: FC<DonutChartProps> = ({
  percentage,
  size = 160,
  strokeWidth = 14,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        {/* 배경 원 */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#EEEEEE"
          strokeWidth={strokeWidth}
        />
        {/* 진행 원 */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#FF412E"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      {/* 중앙 텍스트 */}
      <div className="absolute flex flex-col items-center">
        <span className="text-3xl font-bold text-foreground">
          {Math.round(percentage)}%
        </span>
        <span className="text-xs text-muted-foreground">정답률</span>
      </div>
    </div>
  );
};

export default DonutChart;
