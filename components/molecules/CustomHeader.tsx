"use client";

import { LeftArrowButton, TextButton } from "@/components/atoms";
import { useRouter } from "@/lib/navigation";
import { Button } from "../ui/button";
import { FC } from "react";

interface CustomHeaderProps {
  title: string;
  rightButtonLabel?: string;
  showIcon?: boolean;
  onRightButtonClick?: () => void;
  isActive?: boolean;
}

export const CustomHeader: FC<CustomHeaderProps> = ({
  title,
  showIcon = false,
  rightButtonLabel = "",
  onRightButtonClick,
  isActive = false,
}) => {
  const router = useRouter();

  return (
    <>
      <header className="fixed left-1/2 top-0 z-50 flex h-[90px] w-full max-w-screen-sm -translate-x-1/2 items-center justify-between bg-white px-6 md:max-w-none">
        <LeftArrowButton
          onClick={() => {
            router.back();
          }}
        />
        <p className="pointer-events-none absolute left-1/2 -translate-x-1/2 text-lg font-semibold">
          {title}
        </p>
        {showIcon ? (
          <Button
            variant="textOnly"
            size="icon"
            onClick={() => router.push("/")}
          >
            <img src="/Home.svg" alt="arrow-left" width={32} height={32} />
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
      <div aria-hidden="true" className="h-[90px] shrink-0" />
    </>
  );
};
