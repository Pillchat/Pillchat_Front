"use client";

import { LeftArrowButton, TextButton } from "@/components/atoms";
import { useRouter } from "next/navigation";
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
    <header className="flex w-full items-center justify-between px-6 py-4">
      <LeftArrowButton
        onClick={() => {
          router.back();
        }}
      />
      <p className="text-lg font-semibold">{title}</p>
      {showIcon ? (
        <Button variant="textOnly" size="icon" onClick={() => router.push("/")}>
          <img src="/Home.svg" alt="arrow-left" width={32} height={32} />
        </Button>
      ) : (
        <TextButton
          label={rightButtonLabel}
          variant="textOnly"
          onClick={onRightButtonClick}
          className={`text-md p-0 ${
            isActive ? "text-foreground" : "text-muted-foreground"
          }`}
        />
      )}
    </header>
  );
};
