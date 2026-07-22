"use client";

import Image from "next/image";
import Link from "next/link";
import { Bookmark, Heart, Lock, MessageCircle, Star } from "lucide-react";
import { useEffect, useState } from "react";

import { AppShell, CustomHeader } from "@/components/molecules";
import {
  useCreateMarketCommentMutation,
  useDeleteMarketCommentMutation,
  useDeleteMarketItemMutation,
  useToggleMarketLikeMutation,
  useToggleMarketScrapMutation,
  useUpdateMarketCommentMutation,
} from "@/hooks/mutations";
import { useMarketCommentsQuery, useMarketDetailQuery } from "@/hooks/queries";
import { getCurrentUserId } from "@/lib/client/auth";
import { getMarketSample } from "@/lib/market/api";
import { useRouter } from "@/lib/navigation";
import type { MarketGrade } from "@/types/market";

const gradeLabels: Record<MarketGrade, string> = {
  GRADE_1: "1학년",
  GRADE_2: "2학년",
  GRADE_3: "3학년",
  GRADE_4: "4학년",
  GRADE_5: "5학년",
  GRADE_6: "6학년",
};

const formatDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "날짜 없음";
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

export function MarketDetailClient({ marketId }: { marketId: string }) {
  const router = useRouter();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const [commentPage, setCommentPage] = useState(0);
  const [actionError, setActionError] = useState<string | null>(null);

  const detailQuery = useMarketDetailQuery(marketId);
  const commentsQuery = useMarketCommentsQuery(marketId, {
    page: commentPage,
    size: 20,
    sort: ["createdAt,desc"],
  });
  const likeMutation = useToggleMarketLikeMutation();
  const scrapMutation = useToggleMarketScrapMutation();
  const deleteItemMutation = useDeleteMarketItemMutation();
  const createCommentMutation = useCreateMarketCommentMutation();
  const updateCommentMutation = useUpdateMarketCommentMutation();
  const deleteCommentMutation = useDeleteMarketCommentMutation();

  useEffect(() => {
    setCurrentUserId(getCurrentUserId());
  }, []);

  if (detailQuery.isLoading) {
    return (
      <AppShell>
        <CustomHeader title="자료 상세" />
        <div className="mx-6 mt-4 h-[32rem] animate-pulse rounded-xl bg-primary-980" />
      </AppShell>
    );
  }

  if (detailQuery.isError || !detailQuery.data) {
    return (
      <AppShell>
        <CustomHeader title="자료 상세" />
        <main className="flex min-h-[28rem] flex-col items-center justify-center px-6 text-center">
          <p className="text-title-small text-foreground">
            자료 상세 정보를 불러오지 못했습니다.
          </p>
          <button
            type="button"
            onClick={() => void detailQuery.refetch()}
            className="mt-4 text-label-medium text-primary"
          >
            다시 시도
          </button>
        </main>
      </AppShell>
    );
  }

  const item = detailQuery.data;
  const comments = commentsQuery.data?.content ?? [];
  const isSeller =
    currentUserId !== null && String(item.sellerId) === currentUserId;
  const priceLabel =
    item.price > 0 ? `${item.price.toLocaleString("ko-KR")}원` : "무료";

  const runAction = async (action: () => Promise<unknown>) => {
    setActionError(null);
    try {
      await action();
      return true;
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "요청을 처리하지 못했습니다.",
      );
      return false;
    }
  };

  const openSample = async () => {
    const previewWindow = window.open("about:blank", "_blank");
    if (!previewWindow) {
      setActionError("팝업이 차단되어 맛보기를 열지 못했습니다.");
      return;
    }
    previewWindow.opener = null;

    const succeeded = await runAction(async () => {
      const url = await getMarketSample(marketId);
      previewWindow.location.href = url;
    });
    if (!succeeded) previewWindow.close();
  };

  const deleteItem = async () => {
    if (!window.confirm("이 자료를 삭제하시겠습니까?")) return;
    const succeeded = await runAction(() =>
      deleteItemMutation.mutateAsync(marketId),
    );
    if (succeeded) router.replace("/market");
  };

  const submitComment = async () => {
    const content = comment.trim();
    if (!content) return;
    const succeeded = await runAction(() =>
      createCommentMutation.mutateAsync({
        marketId,
        body: { content },
      }),
    );
    if (succeeded) {
      setComment("");
      setCommentPage(0);
    }
  };

  const submitCommentEdit = async () => {
    if (!editingCommentId || !editingContent.trim()) return;
    const succeeded = await runAction(() =>
      updateCommentMutation.mutateAsync({
        commentId: editingCommentId,
        body: { content: editingContent.trim() },
      }),
    );
    if (succeeded) {
      setEditingCommentId(null);
      setEditingContent("");
    }
  };

  const deleteComment = async (commentId: number) => {
    if (!window.confirm("댓글을 삭제하시겠습니까?")) return;
    const succeeded = await runAction(() =>
      deleteCommentMutation.mutateAsync(commentId),
    );
    if (succeeded && comments.length === 1 && commentPage > 0) {
      setCommentPage((current) => current - 1);
    }
  };

  return (
    <AppShell bottomSpacing="cta">
      <CustomHeader
        title="자료 상세"
        rightSlot={
          isSeller ? (
            <div className="flex items-center gap-3 text-label-medium">
              <Link
                href={`/market/${marketId}/edit`}
                className="text-foreground"
              >
                수정
              </Link>
              <button
                type="button"
                onClick={() => void deleteItem()}
                disabled={deleteItemMutation.isPending}
                className="text-primary disabled:opacity-50"
              >
                삭제
              </button>
            </div>
          ) : undefined
        }
      />

      <main className="px-6 pb-8 pt-4">
        <section className="overflow-hidden rounded-lg bg-primary-980 text-center">
          {item.coverImageUrl ? (
            <div className="relative h-56">
              <Image
                src={item.coverImageUrl}
                alt={`${item.title} 표지`}
                fill
                sizes="(max-width: 640px) 100vw, 448px"
                unoptimized
                className="object-cover"
              />
            </div>
          ) : (
            <div className="flex h-44 items-center justify-center text-5xl">
              📚
            </div>
          )}
          <div className="px-6 pb-7 pt-5">
            <p className="text-label-medium text-brand">
              {item.subjectName} · {gradeLabels[item.grade]}
            </p>
            <h1 className="mt-2 text-headline-medium text-foreground">
              {item.title}
            </h1>
            <button
              type="button"
              disabled={!item.hasSample}
              onClick={() => void openSample()}
              className="mt-5 inline-flex h-11 items-center justify-center rounded-xl bg-card px-5 text-sm font-semibold text-brand disabled:cursor-not-allowed disabled:opacity-50"
            >
              {item.hasSample ? "맛보기 보기" : "맛보기 없음"}
            </button>
          </div>
        </section>

        <section className="mt-5 flex items-center justify-between rounded-xl border border-border p-4">
          <button
            type="button"
            onClick={() =>
              void runAction(() => likeMutation.mutateAsync(marketId))
            }
            disabled={likeMutation.isPending}
            aria-label={item.liked ? "좋아요 취소" : "좋아요"}
            className={`inline-flex items-center gap-1.5 text-title-small ${
              item.liked ? "text-primary" : "text-foreground"
            }`}
          >
            <Heart
              aria-hidden="true"
              className={`h-5 w-5 ${item.liked ? "fill-current" : ""}`}
            />
            {item.likeCount ?? 0}
          </button>
          <span
            className="inline-flex items-center gap-1.5 text-title-small text-foreground"
            aria-label={`평점 ${item.averageRating ?? 0}`}
          >
            <Star
              aria-hidden="true"
              className="h-5 w-5 fill-brand text-brand"
            />
            {item.averageRating ?? 0}
          </span>
          <span
            className="inline-flex items-center gap-1.5 text-title-small text-foreground"
            aria-label={`댓글 ${item.commentCount ?? 0}개`}
          >
            <MessageCircle aria-hidden="true" className="h-5 w-5 text-brand" />
            {item.commentCount ?? 0}
          </span>
          <button
            type="button"
            onClick={() =>
              void runAction(() => scrapMutation.mutateAsync(marketId))
            }
            disabled={scrapMutation.isPending}
            className={item.scrapped ? "text-primary" : "text-foreground"}
            aria-label={item.scrapped ? "스크랩 취소" : "스크랩"}
          >
            <Bookmark
              aria-hidden="true"
              className={`h-5 w-5 ${item.scrapped ? "fill-current" : ""}`}
            />
          </button>
        </section>

        {actionError && (
          <p
            className="mt-4 rounded-xl bg-primary-980 px-4 py-3 text-body-small text-primary"
            role="alert"
          >
            {actionError}
          </p>
        )}

        <section className="mt-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-label-medium text-muted-foreground">판매자</p>
              <Link
                href={`/market?sellerId=${item.sellerId}`}
                className="mt-1 block text-title-large text-foreground"
              >
                @{item.sellerNickname || "판매자"}
              </Link>
            </div>
            <strong className="text-headline-small text-primary">
              {priceLabel}
            </strong>
          </div>
          <p className="mt-5 whitespace-pre-wrap text-body-medium leading-6 text-muted-foreground">
            {item.content || "등록된 자료 설명이 없습니다."}
          </p>
          {item.tags?.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {item.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-primary-980 px-3 py-1 text-label-small text-primary"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
          <p className="mt-4 text-body-small text-muted-foreground">
            등록 {formatDate(item.createdAt)} · {item.purchaseCount ?? 0}회 구매
          </p>
        </section>

        <section className="mt-8 border-t border-border pt-7">
          <h2 className="text-headline-small text-foreground">댓글</h2>
          <div className="mt-4 rounded-xl border border-border p-4">
            <textarea
              aria-label="댓글 내용"
              value={comment}
              onChange={(event) =>
                setComment(event.target.value.slice(0, 1000))
              }
              className="min-h-24 w-full resize-none bg-transparent text-body-medium outline-none"
              placeholder="자료에 대한 댓글을 남겨주세요."
            />
            <div className="mt-2 flex items-center justify-between">
              <span className="text-body-small text-muted-foreground">
                {comment.length}/1000
              </span>
              <button
                type="button"
                disabled={!comment.trim() || createCommentMutation.isPending}
                onClick={() => void submitComment()}
                className="h-9 rounded-xl bg-primary px-4 text-label-medium text-white disabled:bg-gray-100 disabled:text-gray-500"
              >
                등록
              </button>
            </div>
          </div>

          {commentsQuery.isLoading ? (
            <div className="mt-4 h-28 animate-pulse rounded-xl bg-primary-980" />
          ) : commentsQuery.isError ? (
            <div className="mt-4 rounded-xl border border-dashed border-border p-5 text-center">
              <p className="text-body-medium text-muted-foreground">
                댓글을 불러오지 못했습니다.
              </p>
              <button
                type="button"
                onClick={() => void commentsQuery.refetch()}
                className="mt-2 text-label-medium text-primary"
              >
                다시 시도
              </button>
            </div>
          ) : comments.length === 0 ? (
            <p className="py-10 text-center text-body-medium text-muted-foreground">
              아직 댓글이 없습니다.
            </p>
          ) : (
            <div className="mt-4 divide-y divide-border">
              {comments.map((marketComment) => {
                const isAuthor =
                  currentUserId !== null &&
                  String(marketComment.userId) === currentUserId;
                const isEditing = editingCommentId === marketComment.id;

                return (
                  <article key={marketComment.id} className="py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <strong className="text-title-small text-foreground">
                          {marketComment.nickname || "사용자"}
                        </strong>
                        <time className="ml-2 text-body-small text-muted-foreground">
                          {formatDate(
                            marketComment.modifiedAt || marketComment.createdAt,
                          )}
                        </time>
                      </div>
                      {isAuthor && (
                        <div className="flex gap-3 text-label-small">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCommentId(marketComment.id);
                              setEditingContent(marketComment.content);
                            }}
                          >
                            수정
                          </button>
                          <button
                            type="button"
                            onClick={() => void deleteComment(marketComment.id)}
                            disabled={deleteCommentMutation.isPending}
                            className="text-primary disabled:opacity-50"
                          >
                            삭제
                          </button>
                        </div>
                      )}
                    </div>
                    {isEditing ? (
                      <div className="mt-3">
                        <textarea
                          aria-label="댓글 수정 내용"
                          value={editingContent}
                          onChange={(event) =>
                            setEditingContent(event.target.value.slice(0, 1000))
                          }
                          className="min-h-20 w-full rounded-xl border border-input px-3 py-2 text-body-medium outline-none"
                        />
                        <div className="mt-2 flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setEditingCommentId(null)}
                            className="h-9 rounded-xl border border-border px-4 text-label-medium"
                          >
                            취소
                          </button>
                          <button
                            type="button"
                            onClick={() => void submitCommentEdit()}
                            disabled={
                              !editingContent.trim() ||
                              updateCommentMutation.isPending
                            }
                            className="h-9 rounded-xl bg-primary px-4 text-label-medium text-white disabled:opacity-50"
                          >
                            저장
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="mt-3 whitespace-pre-wrap text-body-medium text-muted-foreground">
                        {marketComment.content}
                      </p>
                    )}
                  </article>
                );
              })}
            </div>
          )}

          {commentsQuery.data && commentsQuery.data.totalPages > 1 && (
            <nav
              className="mt-4 flex items-center justify-center gap-4"
              aria-label="댓글 페이지 이동"
            >
              <button
                type="button"
                disabled={commentsQuery.data.first || commentsQuery.isFetching}
                onClick={() =>
                  setCommentPage((current) => Math.max(0, current - 1))
                }
                className="h-9 rounded-xl border border-border px-3 text-label-medium disabled:opacity-40"
              >
                이전
              </button>
              <span className="text-body-small text-muted-foreground">
                {commentsQuery.data.number + 1} /{" "}
                {commentsQuery.data.totalPages}
              </span>
              <button
                type="button"
                disabled={commentsQuery.data.last || commentsQuery.isFetching}
                onClick={() => setCommentPage((current) => current + 1)}
                className="h-9 rounded-xl border border-border px-3 text-label-medium disabled:opacity-40"
              >
                다음
              </button>
            </nav>
          )}
        </section>
      </main>

      <div className="fixed bottom-[calc(6.5rem+env(safe-area-inset-bottom))] left-1/2 z-40 w-full max-w-app -translate-x-1/2 bg-card px-6 pb-1 pt-3 md:px-8">
        <button
          type="button"
          disabled
          title="구매 API가 아직 제공되지 않습니다."
          className="flex h-[3.625rem] w-full items-center justify-center gap-2 rounded-xl bg-gray-100 text-label-large text-gray-500"
        >
          <Lock aria-hidden="true" className="h-5 w-5" />
          {priceLabel} · 구매 API 준비 중
        </button>
      </div>
    </AppShell>
  );
}
