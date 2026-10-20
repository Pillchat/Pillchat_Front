"use client";

import { PUBLIC_ASSETS } from "@/constants/assets";
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
  rightButtonLoading?: boolean;
}

export const CustomHeader: FC<CustomHeaderProps> = ({
  title,
  showIcon = false,
  rightButtonLabel = "",
  onRightButtonClick,
  isActive = false,
  rightSlot,
  rightButtonLoading = false,
}) => {
  const router = useRouter();

  return (
    <>
      <header className="sticky top-0 z-10 grid min-h-[calc(60px+env(safe-area-inset-top))] w-full shrink-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 bg-white px-4 pb-2 pt-[calc(0.5rem+env(safe-area-inset-top))] sm:px-6">
        <LeftArrowButton onClick={() => router.back()} />
        <p className="min-w-0 text-center text-lg font-semibold">{title}</p>
        {rightSlot !== undefined ? (
          rightSlot
        ) : showIcon ? (
          <Button
            variant="textOnly"
            size="icon"
            onClick={() => router.push("/")}
          >
            <img
              src={PUBLIC_ASSETS.icons.home}
              alt="home"
              width={32}
              height={32}
            />
          </Button>
        ) : rightButtonLabel ? (
          <TextButton
            label={rightButtonLabel}
            loading={rightButtonLoading}
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
