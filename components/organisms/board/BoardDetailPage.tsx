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

const getBoardFileKey = (file: any) => {
  if (typeof file === "string") return file;
  return file?.urlKey ?? file?.key ?? file?.fileKey ?? file?.name ?? "";
};

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
  const [deletingCommentId, setDeletingCommentId] = useState<number | null>(
    null,
  );
  const [commentLikeOverrides, setCommentLikeOverrides] = useState<
    Record<number, boolean>
  >({});
  const [commentLikePendingId, setCommentLikePendingId] = useState<number | null>(
    null,
  );

  const { data: boardData, isLoading: boardLoading } = useQuery({
    queryKey: ["board", boardId],
    queryFn: () => fetchAPI(`/api/boards/${boardId}`, "GET"),
    enabled: !!boardId,
  });

  const boardFileKeys = useMemo(() => {
    if (!Array.isArray(boardData?.images)) return [];

    return boardData.images
      .map((file: any) => getBoardFileKey(file))
      .filter(Boolean);
  }, [boardData?.images]);

  const { data: filesData, isLoading: filesLoading } = useQuery({
    queryKey: ["board-files", boardData?.id, boardFileKeys],
    queryFn: async () => {
      if (boardFileKeys.length === 0) return [];

      const params = new URLSearchParams();
      boardFileKeys.forEach((key) => {
        params.append("keys", key);
      });

      return fetchAPI(`/api/files?${params.toString()}`, "GET");
    },
    enabled: boardFileKeys.length > 0,
  });

  const imageUrls = useMemo(() => {
    if (!Array.isArray(filesData)) return [];

    return filesData
      .filter((file: any) => {
        const key = String(file?.key ?? "").toLowerCase();
        return !key.endsWith(".pdf");
      })
      .map((file: any) => file.preSignedUrl)
      .filter(Boolean);
  }, [filesData]);

  const pdfFile = useMemo(() => {
    if (!Array.isArray(filesData)) return null;

    return (
      filesData.find((file: any) => {
        const key = String(file?.key ?? "").toLowerCase();
        return key.endsWith(".pdf");
      }) ?? null
    );
  }, [filesData]);

  const pdfUrl = pdfFile?.preSignedUrl ?? "";
  const pdfName = pdfFile?.key?.split("/").pop() ?? "";

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

  const likeCommentMutation = useMutation({
    mutationFn: async (payload: { commentId: number; nextLiked: boolean }) => {
      const { commentId, nextLiked } = payload;

      if (nextLiked) {
        return fetchAPI(`/api/boards/comments/${commentId}/like`, "POST");
      }

      return fetchAPI(`/api/boards/comments/${commentId}/like`, "DELETE");
    },
    onMutate: ({ commentId, nextLiked }) => {
      setCommentLikePendingId(commentId);
      setCommentLikeOverrides((prev) => ({
        ...prev,
        [commentId]: nextLiked,
      }));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["board-comments", boardId] });
    },
    onError: (error, variables) => {
      setCommentLikeOverrides((prev) => {
        const next = { ...prev };
        delete next[variables.commentId];
        return next;
      });
      console.error("댓글 좋아요 처리 실패:", error);
      alert("댓글 좋아요 처리에 실패했습니다.");
    },
    onSettled: () => {
      setCommentLikePendingId(null);
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
  const handleCommentReport = (commentId: number) => {
    router.push(`/reports?type=BOARD_COMMENT&id=${commentId}`);
  };

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

  const handleCommentLikeToggle = (comment: any) => {
    const commentId = Number(comment?.id ?? comment?.commentId);
    if (!commentId || commentLikePendingId === commentId) return;

    const baseLiked = Boolean(
      comment?.likeWhether ??
        comment?.isLiked ??
        comment?.liked ??
        comment?.likedByMe ??
        false,
    );
    const currentLiked =
      commentLikeOverrides[commentId] !== undefined
        ? commentLikeOverrides[commentId]
        : baseLiked;

    likeCommentMutation.mutate({
      commentId,
      nextLiked: !currentLiked,
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
                images={imageUrls}
                pdfUrl={pdfUrl}
                pdfName={pdfName}
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
                      const isCommentAuthor = Number(currentUserId) === commentAuthorId;

                      const commentMenuItems: ActionMenuItem[] = isCommentAuthor
                        ? [
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
                          ]
                        : [
                            {
                              id: "report",
                              label: "신고",
                              onClick: () => handleCommentReport(commentId),
                            },
                          ];

                      const profileImage =
                        comment?.profileImageUrl ??
                        comment?.profileImage ??
                        comment?.imageUrl ??
                        "";

                      const baseLiked = Boolean(
                        comment?.likeWhether ??
                          comment?.isLiked ??
                          comment?.liked ??
                          comment?.likedByMe ??
                          false,
                      );

                      const isCommentLiked =
                        commentLikeOverrides[commentId] !== undefined
                          ? commentLikeOverrides[commentId]
                          : baseLiked;

                      const baseLikeCount = Number(comment?.likeCount ?? 0);
                      const likeCount =
                        commentLikeOverrides[commentId] === undefined
                          ? baseLikeCount
                          : commentLikeOverrides[commentId] === baseLiked
                            ? baseLikeCount
                            : commentLikeOverrides[commentId]
                              ? baseLikeCount + 1
                              : Math.max(0, baseLikeCount - 1);

                      return (
                        <div key={commentId} className="flex min-h-[60px] w-full gap-3">
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
                                  {comment?.nickname ?? comment?.userNickname ?? "익명"}
                                </span>
                                <span className="text-[#999999]">
                                  {formatDiffDate(
                                    comment?.createdAt ?? new Date().toISOString(),
                                  )}
                                </span>
                              </div>

                              {editingCommentId === commentId ? (
                                <div className="flex flex-col gap-2">
                                  <input
                                    value={editingCommentValue}
                                    onChange={(e) => setEditingCommentValue(e.target.value)}
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

                              <button
                                type="button"
                                onClick={() => handleCommentLikeToggle(comment)}
                                disabled={commentLikePendingId === commentId}
                                className={
                                  isCommentLiked
                                    ? "flex items-center gap-1 text-xs text-primary"
                                    : "flex items-center gap-1 text-xs text-[#999999]"
                                }
                              >
                                <span>{isCommentLiked ? "♥" : "♡"}</span>
                                <span>{likeCount}</span>
                              </button>
                            </div>

                            <div className="absolute right-0 top-0">
                              <ActionMenu
                                trigger={
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <img src="/Ellipsis.svg" alt="더보기" className="h-5 w-5" />
                                  </Button>
                                }
                                items={commentMenuItems}
                                align="end"
                                side="top"
                                showBackdrop={true}
                              />
                            </div>
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
        className="fixed left-0 right-0 z-20 bg-white px-6"
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