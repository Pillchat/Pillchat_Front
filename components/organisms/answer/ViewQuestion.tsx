import { PharmMoney, TextButton } from "@/components/atoms";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FC } from "react";
import { QuestionResponse } from "@/types/question";
import { format } from "date-fns";
import { map } from "lodash";

export const ViewQuestion: FC<{ question: QuestionResponse }> = ({
  question,
}) => {
  const { title, content, reward, createdAt, images } = question;

  return (
    <div className="mx-6 my-5">
      <Dialog>
        <DialogTrigger asChild>
          <TextButton
            label="질문 펼쳐보기"
            variant="teritary"
            className="w-full text-base font-normal shadow-[0_0_20px_rgba(0,0,0,0.2)]"
          />
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-left">Q. {title}</DialogTitle>
            <div className="flex flex-row justify-between text-sm text-muted-foreground">
              <div className="flex flex-row items-center gap-3 align-middle">
                {/* TODO: 작성자 정보 추가 */}
                <span className="text-foreground">{"작성자"}</span>
                <span className="flex flex-row items-center">
                  <img src="/Eye.svg" alt="eye" className="h-5 w-5" />
                  <span>{"조회수"}</span>
                </span>
                <span>{format(createdAt, "yyyy-MM-dd HH:mm:ss")}</span>
              </div>
              <PharmMoney reward={reward} />
            </div>
          </DialogHeader>
          <div>
            <div className="whitespace-pre-wrap text-foreground">{content}</div>
            {map(images, (image) => (
              <div
                key={image}
                className="mt-4 flex h-48 w-full animate-pulse items-center justify-center rounded-lg bg-brandSecondary"
              />
            ))}
            {/* 이미지 Fallback */}
            <div className="mt-4 flex h-48 w-full animate-pulse items-center justify-center rounded-lg bg-brandSecondary" />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
