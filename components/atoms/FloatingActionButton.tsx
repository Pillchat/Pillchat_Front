"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { FC, ReactNode, useState, cloneElement, isValidElement } from "react";

export interface FloatingAction {
  id: string;
  icon: ReactNode;
  label: string;
  onClick: () => void;
  className?: string;
}

export interface FloatingActionButtonProps {
  /** 메인 버튼 아이콘 */
  mainIcon?: ReactNode;
  /** 메인 버튼 클릭 핸들러 */
  onMainClick?: () => void;
  /** 추가 액션 목록 */
  actions?: FloatingAction[];
  /** 버튼 크기 */
  size?: "sm" | "md" | "lg";
  /** 커스텀 클래스명 */
  className?: string;
  /** 확장 방향 */
  expandDirection?: "up" | "left" | "up-left";
  /** 하단에서의 거리 (px) */
  bottom?: number;
  /** 우측에서의 거리 (px) */
  right?: number;
  /** 버튼 텍스트 */
  text?: string;
}

export const FloatingActionButton: FC<FloatingActionButtonProps> = ({
  mainIcon,
  onMainClick,
  actions = [],
  size = "md",
  className,
  expandDirection = "up",
  bottom = 24,
  right = 24,
  text,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const sizeClasses = {
    sm: "h-12 w-12",
    md: "h-14 w-14",
    lg: "h-16 w-16",
  };

  const iconSizes = {
    sm: "w-6 h-6",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };

  const handleMainClick = () => {
    if (actions.length > 0) {
      setIsExpanded(!isExpanded);
    }
    onMainClick?.();
  };

  const getActionPosition = (index: number) => {
    const spacing = size === "sm" ? 60 : size === "md" ? 70 : 80;
    const offset = (index + 1) * spacing;

    switch (expandDirection) {
      case "up":
        return { bottom: `${offset}px`, right: "0px" };
      case "left":
        return { bottom: "0px", right: `${offset}px` };
      case "up-left":
        return {
          bottom: `${offset * 0.7}px`,
          right: `${offset * 0.7}px`,
        };
      default:
        return { bottom: `${offset}px`, right: "0px" };
    }
  };

  const isRelative = className?.includes("relative");

  return (
    <div
      className={cn(
        "z-50",
        isRelative
          ? "relative"
          : className?.includes("absolute")
            ? "absolute"
            : "fixed",
        className,
      )}
      style={
        !isRelative
          ? {
              bottom: `${bottom}px`,
              right: `${right}px`,
            }
          : undefined
      }
    >
      {/* 배경 오버레이 */}
      {isExpanded && (
        <div
          className="fixed inset-0 -z-10 bg-black/20"
          onClick={() => setIsExpanded(false)}
        />
      )}

      {/* 액션 버튼들 */}
      {actions.map((action, index) => (
        <div
          key={action.id}
          className={cn(
            "absolute transition-all duration-300 ease-out",
            isExpanded
              ? "pointer-events-auto scale-100 opacity-100"
              : "pointer-events-none scale-75 opacity-0",
          )}
          style={{
            ...getActionPosition(index),
            transitionDelay: isExpanded ? `${index * 50}ms` : "0ms",
          }}
        >
          <div className="flex items-center gap-3">
            {/* 라벨 (왼쪽 확장시에만 표시) */}
            {expandDirection.includes("left") && (
              <div className="rounded-lg bg-gray-800 px-3 py-2 text-sm font-medium text-white shadow-lg">
                {action.label}
              </div>
            )}

            {/* 액션 버튼 */}
            <Button
              size="icon"
              variant="secondary"
              className={cn(
                sizeClasses[size],
                "rounded-full border border-gray-200 shadow-lg transition-shadow hover:shadow-xl",
                action.className,
              )}
              onClick={() => {
                action.onClick();
                setIsExpanded(false);
              }}
            >
              <span className={cn(iconSizes[size], "flex items-center justify-center")}>
                {action.icon}
              </span>
              {text && <span className="text-base">{text}</span>}
            </Button>

            {/* 라벨 (위쪽 확장시에만 표시) */}
            {expandDirection === "up" && (
              <div className="absolute -left-2 top-1/2 -translate-x-full -translate-y-1/2 whitespace-nowrap rounded-lg bg-gray-800 px-3 py-2 text-sm font-medium text-white shadow-lg">
                {action.label}
              </div>
            )}
          </div>
        </div>
      ))}

      {/* 메인 버튼 */}
      <Button
        size="icon"
        variant="brand"
        className={cn(
          text ? "h-14 w-auto py-3 pl-4 pr-5" : sizeClasses[size],
          text ? "rounded-[2rem]" : "rounded-full",
          "grid place-items-center shadow-lg transition-all duration-200 hover:shadow-xl",
          !text && "h-[64px] w-[64px]",
          isExpanded && actions.length > 0
            ? "rotate-45 bg-white text-primary"
            : "rotate-0 bg-primary text-white",
        )}
        onClick={handleMainClick}
      >
        <div className="flex items-center justify-center">
          {mainIcon ? (
            mainIcon
          ) : (
            <span className={cn("flex items-center justify-center", iconSizes[size])}>
              {actions.length > 0 ? "+" : "?"}
            </span>
          )}
          {text && <span className="text-base font-medium">{text}</span>}
        </div>
      </Button>
    </div>
  );
};
