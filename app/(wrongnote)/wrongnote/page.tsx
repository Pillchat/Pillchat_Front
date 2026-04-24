"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "@/lib/navigation";
import { fetchAPI } from "@/lib/functions";
import { CustomHeader, TabsWithUnderline } from "@/components/molecules";
import { FloatingActionButton } from "@/components/atoms";
import WrongNoteCard from "./_components/WrongNoteCard";
import type {
  WrongNoteListItem,
  WrongNoteListResponse,
} from "@/types/wrongnote";

const SORT_TABS = [
  { value: "createdAt,desc", label: "최신순" },
  { value: "likesCount,desc", label: "좋아요순" },
];

const PAGE_SIZE = 10;

const WrongNoteListPage = () => {
  const router = useRouter();
  const [sort, setSort] = useState("createdAt,desc");
  const [notes, setNotes] = useState<WrongNoteListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const fetchNotes = useCallback(
    async (pageNum: number, sortBy: string, reset = false) => {
      setLoading(true);
      try {
        const raw = await fetchAPI(
          `/api/wrong-notes?sort=${sortBy}&page=${pageNum}&size=${PAGE_SIZE}`,
          "GET",
        );
        const data: WrongNoteListResponse = raw.data ?? raw;
        const items = Array.isArray(data.content) ? data.content : [];
        setNotes((prev) => (reset ? items : [...prev, ...items]));
        setHasMore(pageNum + 1 < (data.totalPages ?? 0));
      } catch {
        if (reset) setNotes([]);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    setPage(0);
    fetchNotes(0, sort, true);
  }, [sort, fetchNotes]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchNotes(nextPage, sort);
  };

  return (
    <div className="flex h-screen flex-col">
      <CustomHeader title="오답노트" showIcon />

      <TabsWithUnderline
        className="mx-6"
        tabs={SORT_TABS}
        defaultValue={sort}
        onValueChange={setSort}
      />

      <div className="flex-1 overflow-y-auto">
        {loading && notes.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-muted-foreground">불러오는 중...</p>
          </div>
        ) : notes.length > 0 ? (
          <>
            {notes.map((note) => (
              <WrongNoteCard
                key={note.id}
                note={note}
                onClick={() => router.push(`/wrongnote/${note.id}`)}
              />
            ))}
            {hasMore && (
              <button
                className="w-full py-4 text-center text-sm text-muted-foreground"
                onClick={handleLoadMore}
                disabled={loading}
              >
                {loading ? "불러오는 중..." : "더 보기"}
              </button>
            )}
          </>
        ) : (
          <div className="flex h-full flex-col items-center justify-center px-6">
            <p className="text-center text-muted-foreground">
              아직 작성된 오답노트가 없습니다.
            </p>
            <p className="mt-1 text-center text-sm text-muted-foreground">
              오답을 정리하여 효과적으로 복습하세요.
            </p>
          </div>
        )}
      </div>

      {/* FAB */}
      <FloatingActionButton
        mainIcon={
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        }
        size="md"
        bottom={32}
        right={24}
        expandDirection="up"
        actions={[
          {
            id: "new-note",
            label: "오답노트 작성",
            icon: (
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            ),
            onClick: () => router.push("/wrongnote/new"),
          },
          // TODO: AI 시험지 기능 추가 예정
          // {
          //   id: "generate-exam",
          //   label: "AI 시험지 생성",
          //   icon: (
          //     <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          //       <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          //       <polyline points="14 2 14 8 20 8" />
          //       <line x1="16" y1="13" x2="8" y2="13" />
          //       <line x1="16" y1="17" x2="8" y2="17" />
          //     </svg>
          //   ),
          //   onClick: () => router.push("/wrongnote/exams/generate"),
          // },
          // {
          //   id: "exam-list",
          //   label: "시험지 목록",
          //   icon: (
          //     <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          //       <line x1="8" y1="6" x2="21" y2="6" />
          //       <line x1="8" y1="12" x2="21" y2="12" />
          //       <line x1="8" y1="18" x2="21" y2="18" />
          //       <line x1="3" y1="6" x2="3.01" y2="6" />
          //       <line x1="3" y1="12" x2="3.01" y2="12" />
          //       <line x1="3" y1="18" x2="3.01" y2="18" />
          //     </svg>
          //   ),
          //   onClick: () => router.push("/wrongnote/exams"),
          // },
        ]}
      />
    </div>
  );
};

export default WrongNoteListPage;
