"use client";

import { FC, ReactNode, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export interface ActionMenuItem {
  id: string;
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  variant?: "default" | "destructive";
  disabled?: boolean;
}

interface ActionMenuProps {
  trigger: ReactNode;
  items: ActionMenuItem[];
  align?: "start" | "center" | "end";
  side?: "top" | "right" | "bottom" | "left";
  className?: string;
  contentClassName?: string;
  showBackdrop?: boolean;
}

export const ActionMenu: FC<ActionMenuProps> = ({
  trigger,
  items,
  align = "end",
  side = "bottom",
  className,
  contentClassName,
  showBackdrop = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  // 구분선이 필요한 경우를 위해 아이템들을 그룹으로 나누는 로직
  const renderItems = () => {
    return items.map((item, index) => {
      const isDestructive = item.variant === "destructive";
      const showSeparator =
        index > 0 &&
        items[index - 1]?.variant !== "destructive" &&
        isDestructive;

      return (
        <div key={item.id}>
          {showSeparator && <DropdownMenuSeparator />}
          <DropdownMenuItem
            onClick={() => {
              item.onClick();
              setIsOpen(false);
            }}
            disabled={item.disabled}
            className={cn(
              "cursor-pointer",
              isDestructive &&
                "text-red-600 focus:bg-red-50 focus:text-red-600",
              item.disabled && "cursor-not-allowed opacity-50",
            )}
          >
            {item.icon && (
              <span className="mr-2 flex h-4 w-4 items-center justify-center">
                {item.icon}
              </span>
            )}
            <span className="font-medium">{item.label}</span>
          </DropdownMenuItem>
        </div>
      );
    });
  };

  return (
    <>
      {/* 백드롭 오버레이 */}
      {showBackdrop && isOpen && (
        <div className="fixed inset-0 z-40 bg-black/40" />
      )}

      <div className={cn(className)}>
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
          <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
          <DropdownMenuContent
            align={align}
            side={side}
            className={cn("z-50 min-w-[160px]", contentClassName)}
          >
            {renderItems()}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  );
};
