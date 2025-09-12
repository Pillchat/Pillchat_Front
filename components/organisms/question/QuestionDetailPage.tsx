"use client";

import { LikeButton } from "@/components/atoms";
import { CustomHeader } from "@/components/molecules";
import { Button } from "@/components/ui/button";
import { fetchAPI } from "@/lib/functions";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { FC } from "react";
import { QuestionTitleSection } from "./QuestionTitleSection";
import { QuestionContents } from "./QuestionContents";

const TEST = [
  "https://pbs.twimg.com/media/Gz6qPr6bkAAsUCa?format=jpg&name=4096x4096",
  "https://pbs.twimg.com/media/GziRNGKbEAAhOC3?format=jpg&name=4096x4096",
];

export const QuestionDetailPage: FC<{
  questionId: string;
}> = ({ questionId }) => {
  const router = useRouter();

  const { data: questionData, isLoading: questionLoading } = useQuery({
    queryKey: ["question", questionId],
    queryFn: () => fetchAPI(`/api/questions/${questionId}`, "GET"),
    enabled: !!questionId,
  });

  const { data: filesData, isLoading: filesLoading } = useQuery({
    queryKey: ["files", questionData?.id],
    queryFn: () =>
      fetchAPI("/api/files", "GET", {
        keys: [`question/${questionData?.id}`],
      }),
    enabled: !!questionData?.id,
  });

  return (
    <div className="flex min-h-screen flex-col">
      <CustomHeader title="질문광장" showIcon />
      {questionLoading && (
        <div className="mx-6 my-5 h-96 animate-pulse rounded bg-gray-100" />
      )}
      {questionData && (
        <div className="mx-6 flex flex-1 flex-col gap-8 pb-5 pt-5">
          <div className="flex flex-col gap-6">
            <QuestionTitleSection
              title={questionData.title}
              userName={questionData.userName}
              viewCount={questionData.viewCount}
              createdAt={questionData.createdAt}
            />
            <QuestionContents
              content={questionData.content}
              images={TEST}
              filesLoading={filesLoading}
            />
          </div>
          <div>
            <LikeButton
              onClick={() => {
                console.log("like");
              }}
              likeCount={questionData.likeCount}
            />
          </div>
        </div>
      )}
      <div className="sticky bottom-0 mx-6 mb-6">
        <Button
          size="long"
          variant="brand"
          className="w-full"
          onClick={() => {
            router.push(`/answer/${questionId}`);
          }}
        >
          답변하기
        </Button>
      </div>
    </div>
  );
};
