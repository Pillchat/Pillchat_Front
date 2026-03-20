import { FC } from "react";
import { ListCard } from "./ListCard";

type QuestionImage = {
  id: string;
  urlKey: string;
};

interface QuestionListCardProps {
  question: {
    id: string;
    title: string;
    content: string;
    createdAt: string;
    viewCount: number;
    likeCount: number;
    answerCount?: number;
    commentCount?: number;
    images?: string[] | QuestionImage[];
  };
  onClick: () => void;
}

export const QuestionListCard: FC<QuestionListCardProps> = ({
  question,
  onClick,
}) => {
  const firstImage =
    typeof question.images?.[0] === "string"
      ? question.images[0]
      : question.images?.[0]?.urlKey;

  return (
    <ListCard
      onClick={onClick}
      title={question.title}
      content={question.content}
      createdAt={question.createdAt}
      viewCount={question.viewCount}
      likeCount={question.likeCount}
      answerCount={question.answerCount ?? 0}
      commentCount={question.commentCount ?? 0}
      image={firstImage}
    />
  );
};
