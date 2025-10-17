import { FC } from "react";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";

export const LikeButton: FC<{
  onClick: () => void;
  likeCount: number;
}> = ({ onClick, likeCount }) => {
  return (
    <Button
      variant="outline"
      size="icon"
      className="h-14 w-auto rounded-full border px-4 py-2"
      onClick={onClick}
    >
      <img src="/Like.svg" alt="like" className="h-8 w-8" />
      <span className="text-base font-medium">{likeCount}</span>
    </Button>
  );
};
