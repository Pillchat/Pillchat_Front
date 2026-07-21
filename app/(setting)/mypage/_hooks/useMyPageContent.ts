import { useCallback, useEffect, useState } from "react";

import { fetchAPI } from "@/lib/client/fetch";

export type MyPost = {
  id: number;
  title: string;
  category: string;
  categoryName: string;
  createdAt: string;
};

const normalizePosts = (response: unknown): MyPost[] => {
  const payload =
    response && typeof response === "object" && "data" in response
      ? (response as { data?: unknown }).data
      : response;
  const items = Array.isArray(payload)
    ? payload
    : payload &&
        typeof payload === "object" &&
        "content" in payload &&
        Array.isArray((payload as { content?: unknown }).content)
      ? (payload as { content: unknown[] }).content
      : [];

  return items.flatMap((value) => {
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
};

export const useMyPageContent = () => {
  const [posts, setPosts] = useState<MyPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMyPosts = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetchAPI("/api/archive/my-boards", "GET");
      setPosts(normalizePosts(response));
    } catch (fetchError) {
      setPosts([]);
      setError(
        fetchError instanceof Error
          ? fetchError.message
          : "내가 쓴 글을 불러오지 못했습니다.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMyPosts();
  }, [fetchMyPosts]);

  return { posts, isLoading, error, refetch: fetchMyPosts };
};
