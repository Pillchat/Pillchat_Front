"use client";

import { FC, useState, useEffect, useCallback } from "react";
import { fetchAPI, getCurrentUserId } from "@/lib/functions";
import type {
  WrongNoteListItem,
  WrongNoteListResponse,
} from "@/types/wrongnote";

interface NoteSelectModalProps {
  isOpen: boolean;
  onConfirm: (noteIds: number[]) => void;
  onClose: () => void;
}

const PAGE_SIZE = 20;

const NoteSelectModal: FC<NoteSelectModalProps> = ({
  isOpen,
  onConfirm,
  onClose,
}) => {
  const [notes, setNotes] = useState<WrongNoteListItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const currentUserId = getCurrentUserId();

  const fetchNotes = useCallback(async (pageNum: number, reset = false) => {
    setLoading(true);
    try {
      const raw = await fetchAPI(
        `/api/wrong-notes?sort=createdAt,desc&page=${pageNum}&size=${PAGE_SIZE}`,
        "GET",
      );
      const data: WrongNoteListResponse = raw.data ?? raw;
      const items = Array.isArray(data.content)
        ? data.content.filter(
            (note) => Number(note.userId) === Number(currentUserId),
          )
        : [];
      setNotes((prev) => (reset ? items : [...prev, ...items]));
      setHasMore(pageNum + 1 < (data.totalPages ?? 0));
    } catch {
      if (reset) setNotes([]);
    } finally {
      setLoading(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    if (isOpen) {
      setSelectedIds(new Set());
      setPage(0);
      fetchNotes(0, true);
    }
  }, [isOpen, fetchNotes]);

  const toggleNote = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchNotes(nextPage);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40">
      <div className="flex max-h-[80vh] w-full max-w-lg flex-col rounded-t-2xl bg-white">
        {/* 헤더 */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-lg font-bold text-foreground">오답노트 선택</h2>
          <button className="text-muted-foreground" onClick={onClose}>
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* 목록 */}
        <div className="flex-1 overflow-y-auto">
          {notes.length === 0 && !loading ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              오답노트가 없습니다.
            </p>
          ) : (
            <>
              {notes.map((note) => {
                const isSelected = selectedIds.has(note.id);
                return (
                  <button
                    key={note.id}
                    className={`flex w-full items-center gap-3 border-b px-6 py-3 text-left transition-colors ${
                      isSelected ? "bg-brandSecondary" : ""
                    }`}
                    onClick={() => toggleNote(note.id)}
                  >
                    <div
                      className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border ${
                        isSelected ? "border-brand bg-brand" : "border-gray-300"
                      }`}
                    >
                      {isSelected && (
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="white"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <p className="truncate text-sm font-medium text-foreground">
                        {note.title}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {note.subjectCategory && `${note.subjectCategory} · `}
                        {note.content}
                      </p>
                    </div>
                  </button>
                );
              })}
              {hasMore && (
                <button
                  className="w-full py-3 text-center text-sm text-muted-foreground"
                  onClick={handleLoadMore}
                  disabled={loading}
                >
                  {loading ? "불러오는 중..." : "더 보기"}
                </button>
              )}
            </>
          )}
        </div>

        {/* 하단 확인 */}
        <div className="border-t px-6 py-4">
          <button
            className={`w-full rounded-xl py-3 text-base font-semibold transition-colors ${
              selectedIds.size > 0
                ? "bg-brand text-white"
                : "bg-gray-200 text-gray-400"
            }`}
            disabled={selectedIds.size === 0}
            onClick={() => onConfirm(Array.from(selectedIds))}
          >
            {selectedIds.size > 0
              ? `${selectedIds.size}개 선택 완료`
              : "오답노트를 선택하세요"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NoteSelectModal;
