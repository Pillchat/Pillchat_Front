"use client";

import { LikeButton } from "@/components/atoms";
import {
  ActionMenu,
  ActionMenuItem,
  CustomHeader,
  SelectModal,
} from "@/components/molecules";
import { Button } from "@/components/ui/button";
import {
  fetchAPI,
  getCurrentUserId,
  syncViewCountInQueryData,
} from "@/lib/functions";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { FC, useEffect, useState } from "react";
import { useLikeStatus } from "@/hooks/useLikeStatus";
import { QuestionTitleSection } from "./QuestionTitleSection";
import { QuestionContents } from "./QuestionContents";
import { AnswerDetailPage } from "../answer";

export const QuestionDetailPage: FC<{ questionId: string }> = ({
  questionId,
}) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isLiked, likeCount, toggleLike } = useLikeStatus(questionId);
  const currentUserId = getCurrentUserId();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { data: questionData, isLoading: questionLoading } = useQuery({
    queryKey: ["question", questionId],
    queryFn: () => fetchAPI(`/api/questions/${questionId}`, "GET"),
    enabled: !!questionId,
  });

  useEffect(() => {
    if (
      questionData?.viewCount === undefined ||
      questionData?.viewCount === null
    ) {
      return;
    }

    queryClient.setQueriesData(
      { queryKey: ["questions"] },
      (oldData: unknown) =>
        syncViewCountInQueryData(
          oldData as any,
          questionId,
          questionData.viewCount,
        ),
    );
    queryClient.setQueryData(["home-questions"], (oldData: unknown) =>
      syncViewCountInQueryData(
        oldData as any,
        questionId,
        questionData.viewCount,
      ),
    );
    queryClient.invalidateQueries({ queryKey: ["questions"] });
    queryClient.invalidateQueries({ queryKey: ["home-questions"] });
  }, [questionData?.viewCount, queryClient, questionId]);

  const { data: filesData, isLoading: filesLoading } = useQuery({
    queryKey: ["files", questionData?.id, questionData?.images],
    queryFn: async () => {
      if (!questionData?.images || questionData.images.length === 0) return [];
      const keys = questionData.images.map(
        (image) => `question/${questionData.id}/${image.urlKey}`,
      );
      return fetchAPI("/api/files", "GET", { keys });
    },
    enabled: !!questionData?.id && !!questionData?.images,
  });

  const handleLikeClick = async () => {
    await toggleLike();
  };

  const isAuthor =
    questionData &&
    currentUserId &&
    (questionData.userId ? questionData.userId === currentUserId : false);

  const deleteMutation = useMutation({
    mutationFn: () => fetchAPI(`/api/questions/${questionId}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["questions"] });
      queryClient.invalidateQueries({ queryKey: ["question", questionId] });
      router.push("/qna");
    },
    onError: (error) => {
      console.error("질문 삭제 실패:", error);
      alert("질문 삭제 실패: 인증에 실패했습니다.");
    },
  });

  const handleEdit = () => router.push(`/ask?edit=${questionId}`);
  const handleDelete = () => setShowDeleteConfirm(true);
  const handleReport = () =>
    router.push(`/reports?type=QUESTION&id=${questionId}`);
  const confirmDelete = () => {
    deleteMutation.mutate();
    setShowDeleteConfirm(false);
  };

  const menuItems: ActionMenuItem[] = isAuthor
    ? [
        { id: "edit", label: "수정", onClick: handleEdit },
        {
          id: "delete",
          label: "삭제",
          onClick: handleDelete,
          variant: "destructive",
        },
      ]
    : [{ id: "report", label: "신고", onClick: handleReport }];

  return (
    <div className="flex min-h-screen flex-col">
      <CustomHeader
        title="질문광장"
        showIcon
        rightButtonLabel={isAuthor ? "수정" : undefined}
        onRightButtonClick={
          isAuthor
            ? () => router.push(`/question/${questionId}/edit`)
            : undefined
        }
      />

      {questionLoading && (
        <div className="mx-6 my-5 h-96 animate-pulse rounded bg-gray-100" />
      )}

      {questionData && (
        <>
          <div className="mx-6 flex flex-col gap-8 pb-10 pt-5">
            <div className="flex flex-col gap-6">
              <QuestionTitleSection
                title={questionData.title}
                userName={questionData.nickname}
                viewCount={questionData.viewCount}
                createdAt={questionData.createdAt}
              />
              <QuestionContents
                content={questionData.content}
                images={filesData?.map((file) => file.preSignedUrl) ?? []}
                filesLoading={filesLoading}
              />
            </div>

            <div className="flex items-center justify-between">
              <LikeButton
                onClick={handleLikeClick}
                likeCount={likeCount}
                isLiked={isLiked}
              />
              <ActionMenu
                trigger={
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <img src="/Ellipsis.svg" alt="더보기" className="h-5 w-5" />
                  </Button>
                }
                items={menuItems}
                align="end"
                side="top"
                showBackdrop={true}
              />
            </div>
          </div>

          <div className="border-t-[12px] border-t-[#F4F4F4] py-5" />

          <div className="mx-6 flex flex-1 flex-col gap-5 pb-10">
            {questionData.answerCount > 0 ? (
              <>
                <div className="flex items-start">
                  <p className="text-sm">
                    총 {questionData.answerCount}개의 답변
                  </p>
                </div>
                <AnswerDetailPage questionId={questionId} isAuthor={isAuthor} />
              </>
            ) : (
              <div className="flex flex-col items-center justify-center">
                <p className="text-border">아직 답변이 없습니다.</p>
              </div>
            )}
          </div>
        </>
      )}

      <div className="sticky bottom-0 mx-6 mb-6">
        <Button
          size="long"
          variant="brand"
          className="h-14 w-full text-lg font-medium"
          onClick={() => router.push(`/answer/${questionId}`)}
        >
          답변하기
        </Button>
      </div>

      <SelectModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={confirmDelete}
        title="질문 삭제"
        message="정말로 이 질문을 삭제하시겠습니까? 삭제된 질문은 복구할 수 없습니다."
      />
    </div>
  );
};
