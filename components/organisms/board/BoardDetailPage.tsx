"use client";

import { LikeButton } from "@/components/atoms";
import {
  CustomHeader,
  ActionMenu,
  ActionMenuItem,
  SelectModal,
} from "@/components/molecules";
import { Button } from "@/components/ui/button";
import { fetchAPI, getCurrentUserId } from "@/lib/functions";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { FC, useState } from "react";
import { useLikeStatus } from "@/hooks/useLikeStatus";
import { BoardTitleSection } from "./BoardTitleSection";
import { BoardContents } from "./BoardContents";

export const BoardDetailPage: FC<{ boardId: string }> = ({ boardId }) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isLiked, likeCount, toggleLike } = useLikeStatus(boardId, "boards");
  const currentUserId = getCurrentUserId();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { data: boardData, isLoading: boardLoading } = useQuery({
    queryKey: ["board", boardId],
    queryFn: () => fetchAPI(`/api/boards/${boardId}`, "GET"),
    enabled: !!boardId,
  });

  const { data: filesData, isLoading: filesLoading } = useQuery({
    queryKey: ["board-files", boardData?.id, boardData?.images],
    queryFn: async () => {
      if (!boardData?.images || boardData.images.length === 0) return [];
      const keys = boardData.images.map(
        (image: any) => `board/${boardData.id}/${image.urlKey}`,
      );
      return fetchAPI("/api/files", "GET", { keys });
    },
    enabled: !!boardData?.id && !!boardData?.images,
  });

  const handleLikeClick = async () => {
    await toggleLike();
  };

  const isAuthor =
    boardData &&
    currentUserId &&
    (boardData.userId ? boardData.userId === currentUserId : false);

  const deleteMutation = useMutation({
    mutationFn: () => fetchAPI(`/api/boards/${boardId}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["boards"] });
      queryClient.invalidateQueries({ queryKey: ["board", boardId] });
      router.push("/board");
    },
    onError: (error) => {
      console.error("게시글 삭제 실패:", error);
      alert("게시글 삭제에 실패했습니다.");
    },
  });

  const handleEdit = () => router.push(`/post?edit=${boardId}`);
  const handleDelete = () => setShowDeleteConfirm(true);
  const handleReport = () => router.push(`/reports?type=BOARD&id=${boardId}`);

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
        title="게시판"
        showIcon
        rightButtonLabel={isAuthor ? "수정" : undefined}
        onRightButtonClick={isAuthor ? handleEdit : undefined}
      />

      {boardLoading && (
        <div className="mx-6 my-5 h-96 animate-pulse rounded bg-gray-100" />
      )}

      {boardData && (
        <>
          <div className="mx-6 flex flex-col gap-8 pb-10 pt-5">
            <div className="flex flex-col gap-6">
              <BoardTitleSection
                title={boardData.title}
                userName={boardData.nickname}
                viewCount={boardData.viewCount}
                createdAt={boardData.createdAt}
              />
              <BoardContents
                content={boardData.content}
                images={filesData?.map((file: any) => file.preSignedUrl) ?? []}
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
        </>
      )}

      <SelectModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={confirmDelete}
        title="게시글 삭제"
        message="정말로 이 게시글을 삭제하시겠습니까? 삭제된 게시글은 복구할 수 없습니다."
      />
    </div>
  );
};
