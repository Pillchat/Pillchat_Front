"use client";

import { LeftArrowButton, TextButton } from "@/components/atoms";
import { useRouter } from "next/navigation";
import { Button } from "../ui/button";
import { FC } from "react";

interface InfoHeaderProps {
  title: string;
  rightButtonLabel?: string;
  showIcon?: boolean;
  onRightButtonClick?: () => void;
  isActive?: boolean;
  infoIconSrc?: string; // 오른쪽 끝 아이콘 경로
  infoIconSize?: string; // ex) "2rem", "24px", "1.5em"
  infoIconOnClick?: () => void; // 아이콘 클릭 이벤트
}

export const InfoHeader: FC<InfoHeaderProps> = ({
  title,
  showIcon = false,
  rightButtonLabel = "",
  onRightButtonClick,
  isActive = false,
  infoIconSrc,
  infoIconSize = "1.5rem",
  infoIconOnClick,
}) => {
  const router = useRouter();

  return (
    <header className="flex w-full items-center justify-between px-6 py-4">
      {/* 왼쪽: 뒤로가기 */}
      <LeftArrowButton onClick={() => router.back()} />

      {/* 가운데: 타이틀 */}
      <p className="text-lg font-semibold">{title}</p>

      {/* 오른쪽: 버튼 + 아이콘 */}
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
            onClick={onRightButtonClick}
            className={`text-md p-0 ${
              isActive ? "text-foreground" : "text-muted-foreground"
            }`}
          />
        )}

        {infoIconSrc && (
          <img
            src={infoIconSrc}
            alt="info-icon"
            style={{ width: infoIconSize, height: infoIconSize }}
            className="cursor-pointer"
            onClick={infoIconOnClick}
          />
        )}
      </div>
    </header>
  );
};
