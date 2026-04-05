import { FC } from "react";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";

export const LikeButton: FC<{
  onClick: () => void;
  likeCount: number;
  isLiked?: boolean;
}> = ({ onClick, likeCount, isLiked = false }) => {
  return (
    <Button
      variant="outline"
      size="icon"
      className={cn(
        "h-14 w-auto rounded-full border px-4 py-2",
        isLiked && "border-primary bg-accent",
      )}
      onClick={onClick}
    >
      <img src={isLiked ? "/LikeFilled.svg" : "/Like.svg"} alt="like" className="h-8 w-8" />
      <span className={cn("text-base font-medium", isLiked && "text-primary")}>
        {likeCount}
      </span>
    </Button>
  );
};
