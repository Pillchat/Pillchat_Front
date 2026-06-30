import { IconWithCount } from "@/components/atoms";
import { format } from "date-fns";
import { FC } from "react";

export const BoardTitleSection: FC<{
  title: string;
  userName: string;
  viewCount: number;
  createdAt: string;
  onUserClick?: () => void;
}> = ({ title, userName, viewCount, createdAt, onUserClick }) => {
  return (
    <div className="flex flex-col gap-1">
      <div className="text-left text-xl font-semibold">{title}</div>
      <div className="flex flex-row justify-between text-sm text-muted-foreground">
        <div className="flex flex-row items-center gap-3 align-middle">
          {onUserClick ? (
            <button
              type="button"
              onClick={onUserClick}
              className="text-foreground"
            >
              {userName}
            </button>
          ) : (
            <span className="text-foreground">{userName}</span>
          )}
          <IconWithCount src="/icons/Eye.svg" count={viewCount} />
          <span>{format(createdAt, "yyyy-MM-dd HH:mm:ss")}</span>
        </div>
      </div>
    </div>
  );
};
