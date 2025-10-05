import { FC } from "react";
import { IconWithCount, PharmMoney } from "../atoms";
import { fetchAPI } from "@/lib/functions";

export const ListCard: FC<{
  onClick: () => void;
  title: string;
  content: string;
  createdAt: string;
  viewCount: number;
  answerCount: number;
  commentCount: number;
  image?: string;
}> = ({
  title,
  content,
  createdAt,
  viewCount,
  answerCount,
  commentCount,
  onClick,
  image,
}) => {
  return (
    <div onClick={onClick}>
      {image && image.length > 0 && (
        <div className="flex flex-row items-center justify-between gap-3">
          <div className="flex flex-row items-center gap-3 align-middle">
            <img src={image} alt="image" />
          </div>
        </div>
      )}
      <div className="flex flex-row items-center justify-between gap-3">
        <div className="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-base font-semibold">
          Q. {title}
        </div>
        {/* <div className="flex-shrink-0">
          <PharmMoney reward={reward} />
        </div> */}
      </div>
      <div className="overflow-hidden text-ellipsis whitespace-nowrap pt-2 text-xs text-muted-foreground">
        <span>{content}</span>
      </div>
      <div className="mt-2 flex items-center justify-between gap-2 text-xs text-border">
        <div className="flex-1">
          <span>{createdAt}</span>
        </div>
        <div className="flex items-center gap-2">
          <IconWithCount src="/Eye.svg" count={viewCount} />
          <IconWithCount src="/QuestionWithBubble.svg" count={answerCount} />
          <IconWithCount src="/Comments.svg" count={commentCount} />
        </div>
      </div>
    </div>
  );
};
