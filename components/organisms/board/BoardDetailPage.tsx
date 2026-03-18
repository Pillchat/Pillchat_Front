"use client";

import { LikeButton } from "@/components/atoms";
import {
  CustomHeader,
  ActionMenu,
  ActionMenuItem,
  SelectModal,
} from "@/components/molecules";
import { Button } from "@/components/ui/button";
import { fetchAPI, formatDiffDate, getCurrentUserId } from "@/lib/functions";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { FC, useEffect, useMemo, useState } from "react";
import { useLikeStatus } from "@/hooks/useLikeStatus";
import { BoardTitleSection } from "./BoardTitleSection";
import { BoardContents } from "./BoardContents";

type CommentSortType = "latest" | "popular";

export const BoardDetailPage: FC<{ boardId: string }> = ({ boardId }) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isLiked, likeCount, toggleLike } = useLikeStatus(boardId, "boards");
  const currentUserId = getCurrentUserId();

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [commentValue, setCommentValue] = useState("");
  const [isCommentFocused, setIsCommentFocused] = useState(false);
  const [keyboardOffset, setKeyboardOffset] = useState(0);

  const [commentSort, setCommentSort] = useState<CommentSortType>("latest");
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editingCommentValue, setEditingCommentValue] = useState("");
  const [deletingCommentId, setDeletingCommentId] = useState<number | null>(null);

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

  const { data: commentsData, isLoading: commentsLoading } = useQuery({
    queryKey: ["board-comments", boardId],
    queryFn: () => fetchAPI(`/api/boards/${boardId}/comments`, "GET"),
    enabled: !!boardId,
  });

  const comments = useMemo(() => {
    const raw = Array.isArray(commentsData)
      ? commentsData
      : Array.isArray(commentsData?.data)
        ? commentsData.data
        : [];

    const sorted = [...raw].sort((a: any, b: any) => {
      if (commentSort === "popular") {
        const likeDiff = (b?.likeCount ?? 0) - (a?.likeCount ?? 0);
        if (likeDiff !== 0) return likeDiff;
      }

      const aTime = new Date(a?.createdAt ?? 0).getTime();
      const bTime = new Date(b?.createdAt ?? 0).getTime();
      return bTime - aTime;
    });

    return sorted;
  }, [commentsData, commentSort]);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    const updateOffset = () => {
      const next =
        window.innerHeight - vv.height - vv.offsetTop > 0
          ? window.innerHeight - vv.height - vv.offsetTop
          : 0;
      setKeyboardOffset(next);
    };

    updateOffset();
    vv.addEventListener("resize", updateOffset);
    vv.addEventListener("scroll", updateOffset);

    return () => {
      vv.removeEventListener("resize", updateOffset);
      vv.removeEventListener("scroll", updateOffset);
    };
  }, []);

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

  const commentMutation = useMutation({
    mutationFn: () =>
      fetchAPI(`/api/boards/${boardId}/comments`, "POST", {
        content: commentValue.trim(),
      }),
    onSuccess: () => {
      setCommentValue("");
      setIsCommentFocused(false);
      queryClient.invalidateQueries({ queryKey: ["board-comments", boardId] });
    },
    onError: (error) => {
      console.error("댓글 등록 실패:", error);
      alert("댓글 등록에 실패했습니다.");
    },
  });

  const updateCommentMutation = useMutation({
    mutationFn: (payload: { commentId: number; content: string }) =>
      fetchAPI(`/api/boards/comments/${payload.commentId}`, "PUT", {
        content: payload.content.trim(),
      }),
    onSuccess: () => {
      setEditingCommentId(null);
      setEditingCommentValue("");
      queryClient.invalidateQueries({ queryKey: ["board-comments", boardId] });
    },
    onError: (error) => {
      console.error("댓글 수정 실패:", error);
      alert("댓글 수정에 실패했습니다.");
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: (commentId: number) =>
      fetchAPI(`/api/boards/comments/${commentId}`, "DELETE"),
    onSuccess: () => {
      setDeletingCommentId(null);
      queryClient.invalidateQueries({ queryKey: ["board-comments", boardId] });
    },
    onError: (error) => {
      console.error("댓글 삭제 실패:", error);
      alert("댓글 삭제에 실패했습니다.");
    },
  });

  const handleEdit = () => router.push(`/post?edit=${boardId}`);
  const handleDelete = () => setShowDeleteConfirm(true);
  const handleReport = () => router.push(`/reports?type=BOARD&id=${boardId}`);

  const confirmDelete = () => {
    deleteMutation.mutate();
    setShowDeleteConfirm(false);
  };

  const handleCommentSubmit = () => {
    if (!commentValue.trim() || commentMutation.isPending) return;
    commentMutation.mutate();
  };

  const startEditComment = (comment: any) => {
    const commentId = Number(comment?.id ?? comment?.commentId);
    if (!commentId) return;
    setEditingCommentId(commentId);
    setEditingCommentValue(comment?.content ?? "");
  };

  const submitEditComment = () => {
    if (!editingCommentId || !editingCommentValue.trim()) return;
    updateCommentMutation.mutate({
      commentId: editingCommentId,
      content: editingCommentValue,
    });
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
    <div className="flex min-h-screen flex-col pb-[82px]">
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

          <div className="border-t-[12px] border-t-[#F4F4F4]">
            <div className="px-6 pb-6 pt-6">
              <div className="flex items-center gap-4 border-b border-[#F4F4F4] pb-4">
                <span className="text-base font-semibold text-foreground">
                  댓글
                </span>
                <button
                  type="button"
                  className={
                    commentSort === "latest"
                      ? "text-base font-semibold text-primary"
                      : "text-base font-medium text-[#999999]"
                  }
                  onClick={() => setCommentSort("latest")}
                >
                  최신순
                </button>
                <button
                  type="button"
                  className={
                    commentSort === "popular"
                      ? "text-base font-semibold text-primary"
                      : "text-base font-medium text-[#999999]"
                  }
                  onClick={() => setCommentSort("popular")}
                >
                  인기순
                </button>
              </div>

              <div className="pt-5">
                {commentsLoading ? (
                  <div className="py-10 text-center text-sm text-[#999999]">
                    댓글을 불러오는 중...
                  </div>
                ) : comments.length === 0 ? (
                  <div className="py-10 text-center text-sm text-[#999999]">
                    아직 댓글이 없습니다.
                  </div>
                ) : (
                  <div className="flex flex-col gap-5">
                    {comments.map((comment: any) => {
                      const commentId = Number(comment?.id ?? comment?.commentId);
                      const commentAuthorId = Number(comment?.userId ?? comment?.writerId);
                      const isCommentAuthor =
                        Number(currentUserId) === commentAuthorId;

                      const commentMenuItems: ActionMenuItem[] = [
                        {
                          id: "edit",
                          label: "수정",
                          onClick: () => startEditComment(comment),
                        },
                        {
                          id: "delete",
                          label: "삭제",
                          onClick: () => setDeletingCommentId(commentId),
                          variant: "destructive",
                        },
                      ];

                      const profileImage =
                        comment?.profileImageUrl ??
                        comment?.profileImage ??
                        comment?.imageUrl ??
                        "";

                      return (
                        <div
                          key={commentId}
                          className="flex min-h-[60px] w-full gap-3"
                        >
                          <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-[#F4F4F4]">
                            {profileImage ? (
                              <img
                                src={profileImage}
                                alt="프로필"
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="h-full w-full bg-[#EAEAEA]" />
                            )}
                          </div>

                          <div className="relative flex min-h-[60px] flex-1 justify-between">
                            <div className="flex min-h-[60px] flex-1 flex-col justify-between">
                              <div className="flex items-center gap-2 text-xs">
                                <span className="font-semibold text-[#111111]">
                                  {comment?.nickname ??
                                    comment?.userNickname ??
                                    "익명"}
                                </span>
                                <span className="text-[#999999]">
                                  {formatDiffDate(
                                    comment?.createdAt ??
                                      new Date().toISOString(),
                                  )}
                                </span>
                              </div>

                              {editingCommentId === commentId ? (
                                <div className="flex flex-col gap-2">
                                  <input
                                    value={editingCommentValue}
                                    onChange={(e) =>
                                      setEditingCommentValue(e.target.value)
                                    }
                                    className="rounded-[12px] border border-[#C4C4C4] px-3 py-2 text-sm outline-none"
                                  />
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={submitEditComment}
                                      disabled={
                                        !editingCommentValue.trim() ||
                                        updateCommentMutation.isPending
                                      }
                                      className="rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
                                    >
                                      저장
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingCommentId(null);
                                        setEditingCommentValue("");
                                      }}
                                      className="rounded-full border border-[#C4C4C4] px-3 py-1.5 text-xs font-medium text-[#666666]"
                                    >
                                      취소
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <p className="text-sm text-[#333333]">
                                  {comment?.content ?? ""}
                                </p>
                              )}

                              <div className="flex items-center gap-1 text-xs text-[#999999]">
                                <span>♡</span>
                                <span>{comment?.likeCount ?? 0}</span>
                              </div>
                            </div>

                            {isCommentAuthor && (
                              <div className="absolute right-0 top-0">
                                <ActionMenu
                                  trigger={
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8"
                                    >
                                      <img
                                        src="/Ellipsis.svg"
                                        alt="댓글 더보기"
                                        className="h-4 w-4"
                                      />
                                    </Button>
                                  }
                                  items={commentMenuItems}
                                  align="end"
                                  side="bottom"
                                  showBackdrop={true}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      <div
        className="fixed left-0 right-0 z-50 bg-white px-6"
        style={{
          height: 82,
          bottom: keyboardOffset,
        }}
      >
        <div className="relative flex h-full items-center justify-center">
          <input
            value={commentValue}
            onChange={(e) => setCommentValue(e.target.value)}
            onFocus={() => setIsCommentFocused(true)}
            onBlur={() => {
              setTimeout(() => {
                setIsCommentFocused(false);
              }, 120);
            }}
            placeholder="댓글을 입력하세요"
            className="h-[50px] w-full rounded-[20px] border border-[#C4C4C4] px-3 py-3 pr-[88px] text-[#999999] outline-none"
          />

          {isCommentFocused && (
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={handleCommentSubmit}
              disabled={!commentValue.trim() || commentMutation.isPending}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-[20px] bg-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {commentMutation.isPending ? "등록 중" : "올리기"}
            </button>
          )}
        </div>
      </div>

      <SelectModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={confirmDelete}
        title="게시글 삭제"
        message="정말로 이 게시글을 삭제하시겠습니까? 삭제된 게시글은 복구할 수 없습니다."
      />

      <SelectModal
        isOpen={deletingCommentId !== null}
        onClose={() => setDeletingCommentId(null)}
        onConfirm={() => {
          if (!deletingCommentId) return;
          deleteCommentMutation.mutate(deletingCommentId);
        }}
        title="댓글 삭제"
        message="정말로 이 댓글을 삭제하시겠습니까?"
      />
    </div>
  );
};