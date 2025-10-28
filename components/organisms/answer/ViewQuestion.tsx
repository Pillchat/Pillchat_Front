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
import { IconWithCount } from "@/components/atoms";
import { Image } from "@/components/atoms";
import { useFetchImage } from "@/hooks";

export const ViewQuestion: FC<{ question: QuestionResponse }> = ({
  question,
}) => {
  const { title, content, nickname, createdAt } = question;

  const { imageData, imageLoading } = useFetchImage({
    type: "question",
    sourceId: question.id,
    images: question.images,
  });

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
                <span className="text-foreground">{nickname}</span>
                <IconWithCount src="/Eye.svg" count={100} />
                <span>{format(createdAt, "yyyy-MM-dd HH:mm:ss")}</span>
              </div>
            </div>
          </DialogHeader>
          <div>
            <div className="whitespace-pre-wrap text-foreground">{content}</div>
            {map(imageData, (image) => (
              <div key={image.id} className="mt-4 flex h-48 w-full">
                <Image
                  src={image.preSignedUrl}
                  alt={image.name}
                  className="h-full w-full rounded-lg object-contain"
                />
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
