"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { fetchAPI } from "@/lib/functions";
import { CustomHeader } from "@/components/molecules";
import type { WrongNoteDetail, WrongNoteLikeResponse } from "@/types/wrongnote";

const WrongNoteDetailPage = () => {
  const router = useRouter();
  const params = useParams();
  const noteId = params.id as string;
  const [note, setNote] = useState<WrongNoteDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNote = async () => {
      try {
        const raw = await fetchAPI(`/api/wrong-notes/${noteId}`, "GET");
        const data: WrongNoteDetail = raw.data ?? raw;
        setNote(data);
      } catch {
        // 에러 처리
      } finally {
        setLoading(false);
      }
    };
    fetchNote();
  }, [noteId]);

  const handleLike = async () => {
    if (!note) return;
    try {
      const raw = await fetchAPI(`/api/wrong-notes/${noteId}/like`, "POST");
      const data: WrongNoteLikeResponse = raw.data ?? raw;
      setNote({ ...note, isLiked: data.isLiked, likesCount: data.likesCount });
    } catch {
      // 에러 처리
    }
  };

  const handleDelete = async () => {
    if (!confirm("오답노트를 삭제하시겠습니까?")) return;
    try {
      await fetchAPI(`/api/wrong-notes/${noteId}`, "DELETE");
      router.replace("/wrongnote");
    } catch {
      alert("삭제에 실패했습니다.");
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-muted-foreground">불러오는 중...</p>
      </div>
    );
  }

  if (!note) {
    return (
      <div className="flex h-screen flex-col">
        <CustomHeader title="오답노트" showIcon />
        <div className="flex flex-1 items-center justify-center">
          <p className="text-muted-foreground">오답노트를 찾을 수 없습니다.</p>
        </div>
      </div>
    );
  }

  const questionImages = note.images.filter((img) => img.type === "QUESTION");
  const answerImages = note.images.filter((img) => img.type === "ANSWER");
  const sortedSteps = [...note.steps].sort((a, b) => a.stepOrder - b.stepOrder);

  return (
    <div className="flex h-screen flex-col">
      <CustomHeader title="오답노트" showIcon />

      <div className="flex-1 overflow-y-auto">
        {/* 메타 정보 */}
        <div className="border-b px-6 py-4">
          <div className="mb-2 flex items-center gap-2">
            {note.subjectCategory && (
              <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-muted-foreground">
                {note.subjectCategory}
              </span>
            )}
            {note.questionSource && (
              <span className="text-xs text-muted-foreground">
                {note.questionSource}
              </span>
            )}
          </div>
          <h1 className="text-xl font-bold text-foreground">{note.title}</h1>
          <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
            <span>{note.userNickname}</span>
            <span>
              {new Date(note.createdAt).toLocaleDateString("ko-KR")}
            </span>
          </div>
        </div>

        {/* 문제 영역 */}
        <div className="border-b px-6 py-4">
          <h2 className="mb-3 text-sm font-semibold text-muted-foreground">
            문제
          </h2>
          <p className="whitespace-pre-wrap text-base leading-relaxed text-foreground">
            {note.content}
          </p>
          {questionImages.length > 0 && (
            <div className="mt-3 flex flex-col gap-2">
              {questionImages
                .sort((a, b) => a.imageOrder - b.imageOrder)
                .map((img) => (
                  <img
                    key={img.id ?? img.imageOrder}
                    src={img.imageUrl}
                    alt={`문제 이미지 ${img.imageOrder + 1}`}
                    className="w-full rounded-lg"
                  />
                ))}
            </div>
          )}
        </div>

        {/* 풀이 영역 */}
        {sortedSteps.length > 0 && (
          <div className="border-b px-6 py-4">
            <h2 className="mb-3 text-sm font-semibold text-muted-foreground">
              풀이 과정
            </h2>
            <div className="flex flex-col gap-3">
              {sortedSteps.map((step, i) => (
                <div key={step.id ?? i} className="flex gap-3">
                  <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-brand text-xs font-bold text-white">
                    {i + 1}
                  </span>
                  <p className="flex-1 text-sm leading-relaxed text-foreground">
                    {step.content}
                  </p>
                </div>
              ))}
            </div>
            {answerImages.length > 0 && (
              <div className="mt-3 flex flex-col gap-2">
                {answerImages
                  .sort((a, b) => a.imageOrder - b.imageOrder)
                  .map((img) => (
                    <img
                      key={img.id ?? img.imageOrder}
                      src={img.imageUrl}
                      alt={`풀이 이미지 ${img.imageOrder + 1}`}
                      className="w-full rounded-lg"
                    />
                  ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 하단 액션 바 */}
      <div className="flex items-center border-t bg-white px-6 py-3">
        {/* 좋아요 */}
        <button
          className="flex items-center gap-1.5 text-sm"
          onClick={handleLike}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill={note.isLiked ? "#FF412E" : "none"}
            stroke={note.isLiked ? "#FF412E" : "currentColor"}
            strokeWidth="2"
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
          <span className={note.isLiked ? "font-medium text-brand" : "text-muted-foreground"}>
            {note.likesCount}
          </span>
        </button>

        <div className="flex-1" />

        {/* 소유자 전용 버튼 */}
        {note.isOwner && (
          <div className="flex gap-3">
            <button
              className="text-sm text-muted-foreground"
              onClick={() => router.push(`/wrongnote/${noteId}/edit`)}
            >
              수정
            </button>
            <button
              className="text-sm text-red-500"
              onClick={handleDelete}
            >
              삭제
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default WrongNoteDetailPage;
