"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { fetchAPI } from "@/lib/functions";
import { CustomHeader } from "@/components/molecules";
import { SolidButton } from "@/components/atoms";
import type {
  WrongNoteListItem,
  WrongNoteListResponse,
  WrongNoteExam,
} from "@/types/wrongnote";

const GenerateExamPage = () => {
  const router = useRouter();
  const [notes, setNotes] = useState<WrongNoteListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [title, setTitle] = useState("");
  const [questionCount, setQuestionCount] = useState(10);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const raw = await fetchAPI(
          "/api/wrong-notes?sort=createdAt,desc&page=0&size=100",
          "GET",
        );
        const data: WrongNoteListResponse = raw.data ?? raw;
        setNotes(Array.isArray(data.content) ? data.content : []);
      } catch {
        // 에러 처리
      } finally {
        setLoading(false);
      }
    };
    fetchNotes();
  }, []);

  const toggleNote = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === notes.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(notes.map((n) => n.id)));
    }
  };

  const handleGenerate = async () => {
    if (selectedIds.size === 0 || generating) return;
    setGenerating(true);
    setError(null);

    try {
      const body: Record<string, unknown> = {
        noteIds: Array.from(selectedIds),
        questionCount,
      };
      if (title.trim()) body.title = title.trim();

      const raw = await fetchAPI(
        "/api/wrong-notes/generate-exam",
        "POST",
        body,
      );
      const data: WrongNoteExam = raw.data ?? raw;
      router.replace(`/wrongnote/exams/${data.examId}`);
    } catch {
      setError("시험지 생성에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="flex h-screen flex-col">
      <CustomHeader title="AI 시험지 생성" showIcon />

      <div className="flex-1 overflow-y-auto px-6 py-4">
        {/* 시험지 제목 */}
        <div className="mb-5">
          <label className="mb-1.5 block text-sm font-semibold text-foreground">
            시험지 제목 (선택)
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={200}
            placeholder="미입력 시 자동 생성됩니다"
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-base outline-none focus:border-brand"
          />
        </div>

        {/* 문제 수 */}
        <div className="mb-5">
          <label className="mb-1.5 block text-sm font-semibold text-foreground">
            문제 수
          </label>
          <div className="flex items-center gap-3">
            {[5, 10, 15, 20].map((n) => (
              <button
                key={n}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  questionCount === n
                    ? "bg-brand text-white"
                    : "bg-gray-100 text-muted-foreground"
                }`}
                onClick={() => setQuestionCount(n)}
              >
                {n}문제
              </button>
            ))}
          </div>
        </div>

        {/* 오답노트 선택 */}
        <div className="mb-4">
          <div className="mb-2 flex items-center justify-between">
            <label className="text-sm font-semibold text-foreground">
              오답노트 선택{" "}
              <span className="font-normal text-muted-foreground">
                ({selectedIds.size}개 선택)
              </span>
            </label>
            <button className="text-xs text-brand" onClick={toggleAll}>
              {selectedIds.size === notes.length ? "전체 해제" : "전체 선택"}
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-10">
              <p className="text-muted-foreground">불러오는 중...</p>
            </div>
          ) : notes.length === 0 ? (
            <div className="flex items-center justify-center py-10">
              <p className="text-muted-foreground">
                작성된 오답노트가 없습니다.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {notes.map((note) => (
                <button
                  key={note.id}
                  className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-left transition-colors ${
                    selectedIds.has(note.id)
                      ? "border-brand bg-brandSecondary"
                      : "border-gray-200"
                  }`}
                  onClick={() => toggleNote(note.id)}
                >
                  <div
                    className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border ${
                      selectedIds.has(note.id)
                        ? "border-brand bg-brand"
                        : "border-gray-300"
                    }`}
                  >
                    {selectedIds.has(note.id) && (
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
                    {note.subjectCategory && (
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {note.subjectCategory}
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {error && <p className="mb-4 text-sm text-red-500">{error}</p>}
      </div>

      <div className="flex-shrink-0 px-6 pb-6">
        <SolidButton
          content={generating ? "생성 중..." : "시험지 생성"}
          disabled={selectedIds.size === 0 || generating}
          variant={selectedIds.size > 0 && !generating ? "brand" : "disabled"}
          onClick={handleGenerate}
        />
      </div>
    </div>
  );
};

export default GenerateExamPage;
