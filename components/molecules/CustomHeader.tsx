"use client";

import { LeftArrowButton, TextButton } from "@/components/atoms";
import { useRouter } from "next/navigation";
import { Button } from "../ui/button";
import { FC } from "react";

type CustomHeaderProps = {
  title: string;
  rightButtonLabel?: string;
  showIcon?: boolean;
  onRightButtonClick?: () => void;
};

export const CustomHeader: FC<CustomHeaderProps> = ({
  title,
  showIcon = false,
  rightButtonLabel = "",
  onRightButtonClick,
}) => {
  const router = useRouter();

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between bg-background px-6 py-4">
      <LeftArrowButton
        onClick={() => {
          router.back();
        }}
      />
      <p className="text-lg font-bold">{title}</p>
      {showIcon ? (
        <Button variant="textOnly" size="icon" onClick={() => router.push("/")}>
          <img src="/Home.svg" alt="arrow-left" width={32} height={32} />
        </Button>
      ) : (
        <TextButton
          label={rightButtonLabel}
          variant="textOnly"
          onClick={onRightButtonClick}
          className="text-md p-0 text-muted-foreground"
        />
      )}
    </header>
  );
};
