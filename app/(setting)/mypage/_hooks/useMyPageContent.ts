import { useCallback, useEffect, useRef, useState } from "react";

import { fetchAPI } from "@/lib/client/fetch";

export type MyPageContentTab = "posts" | "comments" | "badges";

export type MyPost = {
  id: number;
  title: string;
  category: string;
  categoryName: string;
  createdAt: string;
};

export type MyComment = {
  id: number;
  content: string;
  createdAt: string;
  likeCount: number;
  boardId: number;
  boardTitle: string;
};

export type MyBadge = {
  grade: string;
  questionCount: number;
  answerCount: number;
  acceptedCount: number;
  likeCount: number;
  nextGrade: string | null;
  progress: number;
  target: number;
  rate: number;
};

const unwrapPayload = (response: unknown) =>
  response && typeof response === "object" && "data" in response
    ? (response as { data?: unknown }).data
    : response;

const getItems = (response: unknown): unknown[] => {
  const payload = unwrapPayload(response);

  if (Array.isArray(payload)) return payload;

  if (
    payload &&
    typeof payload === "object" &&
    "content" in payload &&
    Array.isArray((payload as { content?: unknown }).content)
  ) {
    return (payload as { content: unknown[] }).content;
  }

  return [];
};

const toNumber = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const normalizePosts = (response: unknown): MyPost[] =>
  getItems(response).flatMap((value) => {
    if (!value || typeof value !== "object") return [];

    const item = value as Record<string, unknown>;
    const id = Number(item.id ?? item.boardId);
    if (!Number.isFinite(id)) return [];

    return [
      {
        id,
        title:
          typeof item.title === "string" && item.title.trim()
            ? item.title
            : "제목 없음",
        category: typeof item.category === "string" ? item.category : "",
        categoryName:
          typeof item.categoryName === "string" ? item.categoryName : "",
        createdAt: typeof item.createdAt === "string" ? item.createdAt : "",
      },
    ];
  });

const normalizeComments = (response: unknown): MyComment[] =>
  getItems(response).flatMap((value) => {
    if (!value || typeof value !== "object") return [];

    const item = value as Record<string, unknown>;
    const id = Number(item.id);
    const boardId = Number(item.boardId);
    if (!Number.isFinite(id) || !Number.isFinite(boardId)) return [];

    return [
      {
        id,
        boardId,
        content:
          typeof item.content === "string" && item.content.trim()
            ? item.content
            : "내용 없음",
        boardTitle:
          typeof item.boardTitle === "string" && item.boardTitle.trim()
            ? item.boardTitle
            : "제목 없는 게시글",
        createdAt: typeof item.createdAt === "string" ? item.createdAt : "",
        likeCount: toNumber(item.likeCount),
      },
    ];
  });

const normalizeBadge = (response: unknown): MyBadge | null => {
  const payload = unwrapPayload(response);
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return null;
  }

  const item = payload as Record<string, unknown>;

  return {
    grade: typeof item.grade === "string" ? item.grade : "NONE",
    questionCount: toNumber(item.questionCount),
    answerCount: toNumber(item.answerCount),
    acceptedCount: toNumber(item.acceptedCount),
    likeCount: toNumber(item.likeCount),
    nextGrade:
      typeof item.nextGrade === "string" && item.nextGrade.trim()
        ? item.nextGrade
        : null,
    progress: toNumber(item.progress),
    target: toNumber(item.target),
    rate: toNumber(item.rate),
  };
};

export const useMyPageContent = (activeTab: MyPageContentTab) => {
  const [posts, setPosts] = useState<MyPost[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [postsError, setPostsError] = useState<string | null>(null);

  const [comments, setComments] = useState<MyComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsError, setCommentsError] = useState<string | null>(null);

  const [badge, setBadge] = useState<MyBadge | null>(null);
  const [badgeLoading, setBadgeLoading] = useState(false);
  const [badgeError, setBadgeError] = useState<string | null>(null);
  const requestedTabsRef = useRef<Set<MyPageContentTab>>(new Set());
  const [requestedTabs, setRequestedTabs] = useState<Set<MyPageContentTab>>(
    () => new Set(),
  );

  const fetchMyPosts = useCallback(async () => {
    setPostsLoading(true);
    setPostsError(null);

    try {
      const response = await fetchAPI("/api/archive/my-boards", "GET");
      setPosts(normalizePosts(response));
    } catch (fetchError) {
      setPosts([]);
      setPostsError(
        fetchError instanceof Error
          ? fetchError.message
          : "내가 쓴 글을 불러오지 못했습니다.",
      );
    } finally {
      setPostsLoading(false);
    }
  }, []);

  const fetchMyComments = useCallback(async () => {
    setCommentsLoading(true);
    setCommentsError(null);

    try {
      const response = await fetchAPI("/api/archive/my-comments", "GET");
      setComments(normalizeComments(response));
    } catch (fetchError) {
      setComments([]);
      setCommentsError(
        fetchError instanceof Error
          ? fetchError.message
          : "내가 쓴 댓글을 불러오지 못했습니다.",
      );
    } finally {
      setCommentsLoading(false);
    }
  }, []);

  const fetchMyBadge = useCallback(async () => {
    setBadgeLoading(true);
    setBadgeError(null);

    try {
      const response = await fetchAPI("/api/archive/my-badge", "GET");
      setBadge(normalizeBadge(response));
    } catch (fetchError) {
      setBadge(null);
      setBadgeError(
        fetchError instanceof Error
          ? fetchError.message
          : "배지 정보를 불러오지 못했습니다.",
      );
    } finally {
      setBadgeLoading(false);
    }
  }, []);

  useEffect(() => {
    if (requestedTabsRef.current.has(activeTab)) return;
    requestedTabsRef.current.add(activeTab);
    setRequestedTabs((current) => {
      const next = new Set(current);
      next.add(activeTab);
      return next;
    });

    if (activeTab === "posts") void fetchMyPosts();
    if (activeTab === "comments") void fetchMyComments();
    if (activeTab === "badges") void fetchMyBadge();
  }, [activeTab, fetchMyBadge, fetchMyComments, fetchMyPosts]);

  return {
    posts,
    postsLoading:
      postsLoading || (activeTab === "posts" && !requestedTabs.has("posts")),
    postsError,
    refetchPosts: fetchMyPosts,
    comments,
    commentsLoading:
      commentsLoading ||
      (activeTab === "comments" && !requestedTabs.has("comments")),
    commentsError,
    refetchComments: fetchMyComments,
    badge,
    badgeLoading:
      badgeLoading || (activeTab === "badges" && !requestedTabs.has("badges")),
    badgeError,
    refetchBadge: fetchMyBadge,
  };
};
