"use client";

import { type FC, type ReactNode } from "react";

import { LeftArrowButton, TextButton } from "@/components/atoms";
import { useRouter } from "@/lib/navigation";

import { Button } from "../ui/button";

interface CustomHeaderProps {
  title: string;
  rightButtonLabel?: string;
  showIcon?: boolean;
  onRightButtonClick?: () => void;
  isActive?: boolean;
  rightSlot?: ReactNode;
}

export const CustomHeader: FC<CustomHeaderProps> = ({
  title,
  showIcon = false,
  rightButtonLabel = "",
  onRightButtonClick,
  isActive = false,
  rightSlot,
}) => {
  const router = useRouter();

  return (
    <>
      <header className="sticky top-0 z-10 flex h-[calc(60px+env(safe-area-inset-top))] w-full items-center justify-between bg-white px-6 pt-[env(safe-area-inset-top)]">
        <LeftArrowButton onClick={() => router.back()} />
        <p className="pointer-events-none absolute left-1/2 -translate-x-1/2 text-lg font-semibold">
          {title}
        </p>
        {rightSlot !== undefined ? (
          rightSlot
        ) : showIcon ? (
          <Button
            variant="textOnly"
            size="icon"
            onClick={() => router.push("/")}
          >
            <img src="/icons/Home.svg" alt="home" width={32} height={32} />
          </Button>
        ) : rightButtonLabel ? (
          <TextButton
            label={rightButtonLabel}
            variant="textOnly"
            onClick={onRightButtonClick}
            className={`text-md p-0 ${
              isActive ? "text-foreground" : "text-muted-foreground"
            }`}
          />
        ) : (
          <div aria-hidden="true" className="h-9 w-9" />
        )}
      </header>
    </>
  );
};
