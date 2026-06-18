"use client";

import { LeftArrowButton, TextButton } from "@/components/atoms";
import { useRouter } from "@/lib/navigation";
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
    <>
      <header className="fixed left-1/2 top-0 z-50 flex h-[90px] w-full max-w-screen-sm -translate-x-1/2 items-center justify-between bg-white px-6 md:max-w-none">
        <LeftArrowButton onClick={onLeftButtonClick ?? (() => router.back())} />

        <p className="text-lg font-semibold">{title}</p>

        <div className="flex items-center gap-2">
          {showIcon ? (
            <Button
              variant="textOnly"
              size="icon"
              onClick={() => router.push("/")}
            >
              <img src="/icons/Home.svg" alt="home" width={32} height={32} />
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
      <div aria-hidden="true" className="h-[90px] shrink-0" />
    </>
  );
};
