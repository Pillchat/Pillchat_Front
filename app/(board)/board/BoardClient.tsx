"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import {
  BottomNavbar,
  GeneralHeader,
  QuestionListCard,
} from "@/components/molecules";
import { CircleButton } from "@/components/molecules/board";
import { Separator } from "@/components/ui/separator";
import { formatDiffDate } from "@/lib/shared/date";
import {
  buildFileUrlMap,
  getFileKey,
  isPdfFileKey,
} from "@/lib/shared/filePreview";
import {
  getRememberedBoardViewCounts,
  markBoardViewIntent,
} from "@/lib/client/boardView";
import { useRouter } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import { useBoardsQuery, useFilesQuery } from "@/hooks/queries";

export type BoardPageKind = "free" | "tips" | "reviews";

const BOARD_PAGE_CONFIG: Record<
  BoardPageKind,
  {
    title: string;
    path: string;
    uploadTarget: string;
    emptyText: string;
    aliases: string[];
  }
> = {
  free: {
    title: "자유 게시판",
    path: "/board",
    uploadTarget: "free",
    emptyText: "아직 등록된 자유 게시글이 없습니다.",
    aliases: ["FREE", "자유", "자유게시판"],
  },
  tips: {
    title: "꿀팁 게시판",
    path: "/tips",
    uploadTarget: "tips",
    emptyText: "아직 등록된 꿀팁 게시글이 없습니다.",
    aliases: ["TIP", "TIPS", "꿀팁", "꿀팁게시판", "꿀팁 게시판"],
  },
  reviews: {
    title: "후기 게시판",
    path: "/reviews",
    uploadTarget: "reviews",
    emptyText: "아직 등록된 후기 게시글이 없습니다.",
    aliases: ["REVIEW", "REVIEWS", "후기", "후기게시판", "후기 게시판"],
  },
};

const getCategoryText = (item: any) =>
  String(item?.category ?? item?.categoryName ?? item?.boardType ?? "").trim();

const matchesBoardKind = (item: any, kind: BoardPageKind) => {
  const category = getCategoryText(item);

  if (!category) {
    return kind === "free";
  }

  const aliases = BOARD_PAGE_CONFIG[kind].aliases;
  return aliases.some(
    (alias) => category === alias || category.includes(alias),
  );
};

const getCommentCount = (item: any) =>
  item?.answerCount ??
  item?.commentCount ??
  item?.commentsCount ??
  item?.replyCount ??
  item?.repliesCount ??
  0;

const getBoardAttachmentKeys = (item: any): string[] =>
  Array.isArray(item?.images)
    ? item.images
        .map((image: any) => getFileKey(image))
        .filter((key: unknown): key is string => typeof key === "string")
    : [];

type BoardClientProps = {
  kind?: BoardPageKind;
};

const BoardClient = ({ kind = "free" }: BoardClientProps) => {
  const config = BOARD_PAGE_CONFIG[kind];
  const router = useRouter();
  const searchParams = useSearchParams();
  const q = (searchParams.get("q") ?? "").trim();

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [viewCountOverrides, setViewCountOverrides] = useState<
    Record<string, number>
  >({});

  useEffect(() => {
    const syncRememberedViewCounts = () => {
      setViewCountOverrides(getRememberedBoardViewCounts());
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        syncRememberedViewCounts();
      }
    };

    syncRememberedViewCounts();
    window.addEventListener("pageshow", syncRememberedViewCounts);
    window.addEventListener("popstate", syncRememberedViewCounts);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("pageshow", syncRememberedViewCounts);
      window.removeEventListener("popstate", syncRememberedViewCounts);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const boardListParams =
    kind === "tips" ? { sort: "popular", page: 0, size: 20 } : undefined;
  const shouldPreserveServerOrder = kind === "tips";
  const boardsQuery = useBoardsQuery("latest", boardListParams);
  const { data, isLoading, isError, error } = boardsQuery;

  const rawList = useMemo(() => {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.data)) return data.data;
    return [];
  }, [data]);

  const list = useMemo(() => {
    let filtered = rawList.filter((item: any) => matchesBoardKind(item, kind));

    if (q) {
      const terms = q
        .split(/\s+/)
        .filter(Boolean)
        .map((t) => t.toLowerCase());

      filtered = filtered.filter((item: any) => {
        const searchable =
          `${item.title ?? ""} ${item.content ?? ""} ${item.categoryName ?? ""} ${item.nickname ?? ""}`.toLowerCase();

        return terms.every((t) => searchable.includes(t));
      });
    }

    if (shouldPreserveServerOrder) {
      return filtered;
    }

    return [...filtered].sort((a: any, b: any) => {
      const left = new Date(a?.createdAt ?? 0).getTime();
      const right = new Date(b?.createdAt ?? 0).getTime();
      return right - left;
    });
  }, [rawList, q, kind, shouldPreserveServerOrder]);

  const previewFileKeys = useMemo<string[]>(() => {
    return Array.from(
      new Set<string>(
        list.flatMap((item: any): string[] =>
          getBoardAttachmentKeys(item).filter(
            (key: string) => !isPdfFileKey(key),
          ),
        ),
      ),
    );
  }, [list]);

  const { data: previewFilesData } = useFilesQuery({ keys: previewFileKeys });

  const previewImageUrlMap = useMemo(
    () => buildFileUrlMap(previewFileKeys, previewFilesData),
    [previewFilesData, previewFileKeys],
  );

  const handleBoardClick = (boardId: string | number) => {
    markBoardViewIntent(boardId);
    router.push(`/board/${boardId}`);
  };

  const emptyText = q ? `"${q}" 검색 결과가 없습니다.` : config.emptyText;

  const mobileFixedHidden = isSearchOpen
    ? "translate-y-[140%] opacity-0 pointer-events-none"
    : "translate-y-0 opacity-100";

  return (
    <div className="flex min-h-screen flex-col">
      <GeneralHeader
        currentQ={q}
        searchBasePath={config.path}
        hideBottomBorder
        onSearchOpenChange={setIsSearchOpen}
      />

      <div className="px-6 pb-2 pt-1">
        <p className="text-label-medium text-brand">Community</p>
        <h1 className="mt-1 text-headline-large text-foreground">
          {config.title}
        </h1>
      </div>

      <CircleButton
        onUploadPost={() => router.push(`/post?board=${config.uploadTarget}`)}
        className={mobileFixedHidden}
      />

      <div
        className={cn(
          "relative flex-1",
          isSearchOpen ? "overflow-hidden" : undefined,
        )}
      >
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-body-medium text-border">불러오는 중...</span>
          </div>
        ) : isError ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-body-medium text-primary">
              {error instanceof Error
                ? error.message
                : "게시글을 불러오지 못했습니다."}
            </div>
          </div>
        ) : list.length > 0 ? (
          <div className="mx-6 py-5 pb-[5.625rem]">
            <div className="flex flex-col gap-5">
              {list.map((item: any, index: number) => {
                const imageKeys = getBoardAttachmentKeys(item).filter(
                  (key: string) => !isPdfFileKey(key),
                );

                const imageUrls = imageKeys
                  .map((key: string) => previewImageUrlMap[key])
                  .filter(Boolean);

                const previewContent =
                  typeof item?.content === "string" && item.content.trim()
                    ? item.content.trim()
                    : imageUrls.length > 0
                      ? "이미지 첨부"
                      : "첨부 파일 없음";

                const cardData = {
                  ...item,
                  content: previewContent,
                  viewCount: Math.max(
                    Number(item?.viewCount ?? 0),
                    viewCountOverrides[String(item?.id ?? "")] ?? 0,
                  ),
                  userNickname: item?.userNickname ?? item?.nickname ?? "익명",
                  subjectName: item?.subjectName ?? item?.categoryName ?? "",
                  answerCount: getCommentCount(item),
                  createdAt: formatDiffDate(item?.createdAt),
                  images: imageUrls,
                };

                return (
                  <Fragment key={item?.id}>
                    <QuestionListCard
                      question={cardData}
                      onClick={() => handleBoardClick(item.id)}
                    />
                    {index < list.length - 1 && <Separator />}
                  </Fragment>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center pb-[5.625rem]">
            <div className="text-body-medium text-border">{emptyText}</div>
          </div>
        )}
      </div>

      <BottomNavbar className={`${mobileFixedHidden} z-20`} />
    </div>
  );
};

export default BoardClient;
