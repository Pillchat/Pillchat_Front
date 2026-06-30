"use client";

import { LikeButton } from "@/components/atoms";
import {
  CustomHeader,
  ActionMenu,
  ActionMenuItem,
  SelectModal,
} from "@/components/molecules";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { formatDiffDate } from "@/lib/shared/date";
import {
  buildFileUrlMap,
  getFileKey,
  isPdfFileKey,
} from "@/lib/shared/filePreview";
import { getCurrentUserId } from "@/lib/client/auth";
import {
  rememberBoardViewCount,
  shouldSkipBoardViewOnLoad,
} from "@/lib/client/boardView";
import { syncViewCountInQueryData } from "@/lib/shared/syncViewCount";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@/lib/navigation";
import { FC, useEffect, useMemo, useRef, useState } from "react";
import { Bookmark } from "lucide-react";
import { useLikeStatus } from "@/hooks/useLikeStatus";
import { useBoardScrapStatus } from "@/hooks/useBoardScrapStatus";
import {
  useBoardCommentsQuery,
  useBoardQuery,
  useFilesQuery,
} from "@/hooks/queries";
import {
  useCreateBoardCommentMutation,
  useDeleteBoardCommentMutation,
  useDeleteBoardMutation,
  useToggleBoardCommentLikeMutation,
  useUpdateBoardCommentMutation,
} from "@/hooks/mutations";
import { BoardTitleSection } from "./BoardTitleSection";
import { BoardContents } from "./BoardContents";

type CommentSortType = "latest" | "popular";

const shouldSkipViewOnLoad = () => {
  if (typeof window === "undefined") return false;

  const navigationEntry = performance.getEntriesByType("navigation")[0] as
    | PerformanceNavigationTiming
    | undefined;

  if (navigationEntry?.type) {
    return navigationEntry.type === "reload";
  }

  const legacyNavigation = (
    performance as Performance & {
      navigation?: {
        TYPE_RELOAD?: number;
        type?: number;
      };
    }
  ).navigation;

  return legacyNavigation?.type === legacyNavigation?.TYPE_RELOAD;
};

export const BoardDetailPage: FC<{ boardId: string }> = ({ boardId }) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isLiked, likeCount, toggleLike } = useLikeStatus(boardId, "boards");
  const {
    isScrapped,
    scrapCount,
    isLoading: scrapLoading,
    toggleScrap,
  } = useBoardScrapStatus(boardId);
  const currentUserId = getCurrentUserId();
  const commentTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const editingCommentTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const commentBarRef = useRef<HTMLDivElement | null>(null);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [commentValue, setCommentValue] = useState("");
  const [commentAnonymous, setCommentAnonymous] = useState(false);
  const [keyboardOffset, setKeyboardOffset] = useState(0);
  const [commentBarHeight, setCommentBarHeight] = useState(112);

  const [commentSort, setCommentSort] = useState<CommentSortType>("latest");
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editingCommentValue, setEditingCommentValue] = useState("");
  const [deletingCommentId, setDeletingCommentId] = useState<number | null>(
    null,
  );
  const [skipView] = useState(() => shouldSkipBoardViewOnLoad(boardId));
  const [commentLikeOverrides, setCommentLikeOverrides] = useState<
    Record<number, boolean>
  >({});
  const [commentLikePendingId, setCommentLikePendingId] = useState<
    number | null
  >(null);

  const { data: boardData, isLoading: boardLoading } = useBoardQuery(
    boardId,
    { skipView },
    {
      enabled: !!boardId,
      staleTime: skipView ? 60 * 1000 : 0,
      refetchOnMount: skipView ? true : "always",
    },
  );

  useEffect(() => {
    if (boardData?.viewCount === undefined || boardData?.viewCount === null) {
      return;
    }

    rememberBoardViewCount(boardId, boardData.viewCount);

    queryClient.setQueriesData({ queryKey: ["boards"] }, (oldData: unknown) =>
      syncViewCountInQueryData(oldData as any, boardId, boardData.viewCount),
    );
    queryClient.setQueryData(["home-boards-best"], (oldData: unknown) =>
      syncViewCountInQueryData(oldData as any, boardId, boardData.viewCount),
    );
    queryClient.invalidateQueries({ queryKey: ["boards"] });
    queryClient.invalidateQueries({ queryKey: ["home-boards-best"] });
  }, [boardData?.viewCount, boardId, queryClient]);

  const boardFileKeys = useMemo(() => {
    if (!Array.isArray(boardData?.images)) return [];

    return boardData.images
      .map((file: any) => getFileKey(file))
      .filter(Boolean);
  }, [boardData?.images]);

  const { data: filesData, isLoading: filesLoading } = useFilesQuery({
    keys: boardFileKeys,
  });

  const fileUrlMap = useMemo(
    () => buildFileUrlMap(boardFileKeys, filesData),
    [boardFileKeys, filesData],
  );

  const imageUrls = useMemo(
    () =>
      boardFileKeys
        .filter((key) => !isPdfFileKey(key))
        .map((key) => fileUrlMap[key])
        .filter(Boolean),
    [boardFileKeys, fileUrlMap],
  );

  const pdfKey = useMemo(
    () => boardFileKeys.find((key) => isPdfFileKey(key)) ?? "",
    [boardFileKeys],
  );

  const pdfUrl = pdfKey ? (fileUrlMap[pdfKey] ?? "") : "";
  const pdfName = pdfKey.split("/").pop() ?? "";

  const { data: commentsData, isLoading: commentsLoading } =
    useBoardCommentsQuery(boardId);

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

  useEffect(() => {
    const commentBar = commentBarRef.current;
    if (!commentBar) return;

    const updateHeight = () => {
      setCommentBarHeight(Math.ceil(commentBar.getBoundingClientRect().height));
    };

    updateHeight();

    const observer = new ResizeObserver(updateHeight);
    observer.observe(commentBar);

    return () => {
      observer.disconnect();
    };
  }, []);

  const handleLikeClick = async () => {
    await toggleLike();
  };

  const handleScrapClick = async () => {
    const success = await toggleScrap();
    if (!success) {
      alert("게시글 스크랩 처리에 실패했습니다.");
    }
  };

  const isAuthor =
    boardData &&
    currentUserId &&
    (boardData.userId ? boardData.userId === currentUserId : false);

  const deleteMutation = useDeleteBoardMutation({
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

  const likeCommentMutation = useToggleBoardCommentLikeMutation({
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

  const commentMutation = useCreateBoardCommentMutation({
    onSuccess: () => {
      setCommentValue("");
      setCommentAnonymous(false);
      queryClient.invalidateQueries({ queryKey: ["board-comments", boardId] });
    },
    onError: (error) => {
      console.error("댓글 등록 실패:", error);
      alert("댓글 등록에 실패했습니다.");
    },
  });

  const updateCommentMutation = useUpdateBoardCommentMutation({
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

  const deleteCommentMutation = useDeleteBoardCommentMutation({
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
    deleteMutation.mutate(boardId);
    setShowDeleteConfirm(false);
  };

  const handleCommentSubmit = () => {
    if (!commentValue.trim() || commentMutation.isPending) return;
    commentMutation.mutate({
      boardId,
      content: commentValue,
      isAnonymous: commentAnonymous,
    });
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
    <div
      className="flex min-h-screen flex-col"
      style={{ paddingBottom: commentBarHeight }}
    >
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
                onUserClick={
                  boardData.userId &&
                  String(boardData.userId) !== String(currentUserId)
                    ? () => router.push(`/profile/${boardData.userId}`)
                    : undefined
                }
              />
              <BoardContents
                content={boardData.content}
                images={imageUrls}
                pdfUrl={pdfUrl}
                pdfName={pdfName}
                filesLoading={filesLoading}
              />
            </div>

            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <LikeButton
                  onClick={handleLikeClick}
                  likeCount={likeCount}
                  isLiked={isLiked}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label={isScrapped ? "스크랩 취소" : "스크랩"}
                  disabled={scrapLoading}
                  className={
                    isScrapped
                      ? "h-14 w-auto rounded-full border border-primary bg-accent px-4 py-2 text-primary disabled:opacity-60"
                      : "h-14 w-auto rounded-full border px-4 py-2 disabled:opacity-60"
                  }
                  onClick={handleScrapClick}
                >
                  <Bookmark
                    className="h-8 w-8"
                    fill={isScrapped ? "currentColor" : "none"}
                    strokeWidth={1.5}
                  />
                  <span className="text-base font-medium">{scrapCount}</span>
                </Button>
              </div>
              <ActionMenu
                trigger={
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <img
                      src="/icons/Ellipsis.svg"
                      alt="더보기"
                      className="h-5 w-5"
                    />
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
                      const commentId = Number(
                        comment?.id ?? comment?.commentId,
                      );
                      const rawCommentAuthorId =
                        comment?.userId ?? comment?.writerId;
                      const commentAuthorId = Number(rawCommentAuthorId);
                      const isCommentAuthor =
                        Number(currentUserId) === commentAuthorId;
                      const commentAuthorName =
                        comment?.nickname ?? comment?.userNickname ?? "익명";
                      const canOpenCommentAuthorProfile =
                        rawCommentAuthorId &&
                        String(rawCommentAuthorId) !== String(currentUserId);

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

                          <div className="relative flex min-h-[60px] min-w-0 flex-1">
                            <div className="flex min-h-[60px] min-w-0 flex-1 flex-col gap-2 pr-10">
                              <div className="flex items-center gap-2 text-xs">
                                {canOpenCommentAuthorProfile ? (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      router.push(
                                        `/profile/${rawCommentAuthorId}`,
                                      )
                                    }
                                    className="font-semibold text-[#111111]"
                                  >
                                    {commentAuthorName}
                                  </button>
                                ) : (
                                  <span className="font-semibold text-[#111111]">
                                    {commentAuthorName}
                                  </span>
                                )}
                                <span className="text-[#999999]">
                                  {formatDiffDate(
                                    comment?.createdAt ??
                                      new Date().toISOString(),
                                  )}
                                </span>
                              </div>

                              {editingCommentId === commentId ? (
                                <div className="flex flex-col gap-2">
                                  <div className="flex flex-col gap-1">
                                    <Textarea
                                      ref={editingCommentTextareaRef}
                                      value={editingCommentValue}
                                      onChange={(e) =>
                                        setEditingCommentValue(
                                          e.target.value.slice(0, 1000),
                                        )
                                      }
                                      maxLength={1000}
                                      placeholder="댓글을 수정하세요"
                                      rows={1}
                                      className="min-h-[84px] resize-none rounded-[12px] border border-[#C4C4C4] px-3 py-2 text-sm leading-5 text-[#333333] outline-none"
                                    />
                                    <div className="text-right text-xs text-[#999999]">
                                      {editingCommentValue.length}/{1000}
                                    </div>
                                  </div>

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
                                <p className="w-full whitespace-pre-wrap break-words text-sm leading-5 text-[#333333] [overflow-wrap:anywhere]">
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
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                  >
                                    <img
                                      src="/icons/Ellipsis.svg"
                                      alt="더보기"
                                      className="h-5 w-5"
                                    />
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

      {keyboardOffset > 0 && (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed bottom-0 left-1/2 z-30 w-full max-w-screen-sm -translate-x-1/2 bg-white md:max-w-none"
          style={{ height: keyboardOffset }}
        />
      )}

      <div
        ref={commentBarRef}
        className="fixed bottom-0 left-1/2 z-40 w-full max-w-screen-sm -translate-x-1/2 border-t border-[#F4F4F4] bg-white px-6 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3 md:max-w-none"
        style={{ bottom: keyboardOffset }}
      >
        <div className="flex flex-col gap-2">
          <div className="flex items-end gap-2">
            <Textarea
              ref={commentTextareaRef}
              value={commentValue}
              onChange={(e) => setCommentValue(e.target.value.slice(0, 1000))}
              placeholder="댓글을 입력하세요"
              maxLength={1000}
              rows={1}
              className="min-h-[50px] flex-1 resize-none rounded-[20px] border border-[#C4C4C4] px-4 py-3 text-sm leading-5 text-[#111] outline-none placeholder:text-[#999999]"
            />

            <button
              type="button"
              onClick={handleCommentSubmit}
              disabled={!commentValue.trim() || commentMutation.isPending}
              className="h-[50px] shrink-0 rounded-[20px] bg-primary px-4 text-sm font-medium text-white disabled:opacity-50"
            >
              {commentMutation.isPending ? "등록 중" : "올리기"}
            </button>
          </div>

          <div className="flex items-center justify-between text-xs text-[#999999]">
            <label className="flex items-center gap-2 text-sm font-medium text-[#5C5554]">
              <Checkbox
                checked={commentAnonymous}
                onCheckedChange={(checked) =>
                  setCommentAnonymous(checked === true)
                }
              />
              익명
            </label>
            <span>
              {commentValue.length}/{1000}
            </span>
          </div>
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
