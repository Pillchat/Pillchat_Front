import { FC } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchAPI } from "@/lib/functions";
import { ListCard } from "./ListCard";

interface QuestionListCardProps {
  question: {
    id: string;
    title: string;
    content: string;
    createdAt: string;
    viewCount?: number;
    answerCount?: number;
    commentCount?: number;
    images?: Array<{ urlKey: string }>;
  };
  onClick: () => void;
}

export const QuestionListCard: FC<QuestionListCardProps> = ({
  question,
  onClick,
}) => {
  // 질문의 첫 번째 이미지 URL 가져오기
  const { data: imageData } = useQuery({
    queryKey: ["question-image", question.id],
    queryFn: async () => {
      if (!question.images || question.images.length === 0) {
        return null;
      }

      try {
        const result = await fetchAPI("/api/files", "GET", {
          keys: `question/${question.id}/${question.images[0].urlKey}`,
        });
        return result;
      } catch (error) {
        console.error(
          `Failed to fetch image for question ${question.id}:`,
          error,
        );
        return null;
      }
    },
    enabled: !!(question.images && question.images.length > 0),
  });

  return (
    <ListCard
      onClick={onClick}
      title={question.title}
      content={question.content}
      createdAt={question.createdAt}
      viewCount={question.viewCount || 0}
      answerCount={question.answerCount || 0}
      commentCount={question.commentCount || 0}
      image={imageData?.[0].preSignedUrl}
    />
  );
};
