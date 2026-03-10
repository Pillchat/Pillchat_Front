"use client";

import { LeftArrowButton, TextButton } from "@/components/atoms";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { FC } from "react";

interface BoardHeaderProps {
  title: string;
  rightButtonLabel?: string;
  showIcon?: boolean;
  onRightButtonClick?: () => void;
  isActive?: boolean;
  boardIconSrc?: string;
  boardIconSize?: string;
  boardIconOnClick?: () => void;
  onLeftButtonClick?: () => void;
}

export const BoardHeader: FC<BoardHeaderProps> = ({
  title,
  showIcon = false,
  rightButtonLabel = "",
  onRightButtonClick,
  isActive = false,
  boardIconSrc,
  boardIconSize = "1.5rem",
  boardIconOnClick,
  onLeftButtonClick,
}) => {
  const router = useRouter();

  return (
    <header className="flex w-full items-center justify-between px-6 py-4">
      <LeftArrowButton onClick={onLeftButtonClick ?? (() => router.back())} />

      <p className="text-lg font-semibold">{title}</p>

      <div className="flex items-center gap-2">
        {showIcon ? (
          <Button
            variant="textOnly"
            size="icon"
            onClick={() => router.push("/")}
          >
            <img src="/Home.svg" alt="home" width={32} height={32} />
          </Button>
        ) : (
          <TextButton
            label={rightButtonLabel}
            variant="textOnly"
            onClick={isActive ? onRightButtonClick : undefined}
            className={`text-md p-0 ${
                isActive ? "text-primary" : "text-[#666666]"
            }`}
          />
        )}

        {boardIconSrc && (
          <img
            src={boardIconSrc}
            alt="board-icon"
            style={{ width: boardIconSize, height: boardIconSize }}
            className="cursor-pointer"
            onClick={boardIconOnClick}
          />
        )}
      </div>
    </header>
  );
};