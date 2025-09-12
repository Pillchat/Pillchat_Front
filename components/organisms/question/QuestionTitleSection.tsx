import { IconWithCount } from "@/components/atoms";
import { format } from "date-fns";
import { FC } from "react";

export const QuestionTitleSection: FC<{
  title: string;
  userName: string;
  viewCount: number;
  createdAt: string;
}> = ({ title, userName, viewCount, createdAt }) => {
  return (
    <div className="flex flex-col gap-1">
      <div className="text-left text-xl font-semibold">Q. {title}</div>
      <div className="flex flex-row justify-between text-sm text-muted-foreground">
        <div className="flex flex-row items-center gap-3 align-middle">
          {/* 작성자 정보 표시 */}
          <span className="text-foreground">{userName}</span>
          <IconWithCount src="/Eye.svg" count={viewCount} />
          <span>{format(createdAt, "yyyy-MM-dd HH:mm:ss")}</span>
        </div>
        {/* TODO: MVP 이후 도입 */}
        {/* <PharmMoney reward={reward} /> */}
      </div>
    </div>
  );
};
