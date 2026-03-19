import { FC } from "react";
import { ListCard } from "./ListCard";

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
    images?: string[];
  };
  onClick: () => void;
}

export const QuestionListCard: FC<QuestionListCardProps> = ({
  question,
  onClick,
}) => {
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
      image={question.images?.[0]}
    />
  );
};