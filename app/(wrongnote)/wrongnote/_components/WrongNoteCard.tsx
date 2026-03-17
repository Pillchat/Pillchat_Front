"use client";

import { FC } from "react";
import type { WrongNoteListItem } from "@/types/wrongnote";

interface WrongNoteCardProps {
  note: WrongNoteListItem;
  onClick: () => void;
}

const WrongNoteCard: FC<WrongNoteCardProps> = ({ note, onClick }) => {
  const dateStr = new Date(note.createdAt).toLocaleDateString("ko-KR", {
    month: "short",
    day: "numeric",
  });

  return (
    <button
      className="flex w-full flex-col gap-2 border-b px-6 py-4 text-left transition-colors active:bg-gray-50"
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="flex-1 text-base font-semibold text-foreground line-clamp-1">
          {note.title}
        </h3>
        {note.subjectCategory && (
          <span className="flex-shrink-0 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-muted-foreground">
            {note.subjectCategory}
          </span>
        )}
      </div>

      <p className="text-sm leading-relaxed text-muted-foreground line-clamp-2">
        {note.content}
      </p>

      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span>{note.userNickname}</span>
        <span>{dateStr}</span>
        {note.likesCount > 0 && (
          <span className="flex items-center gap-0.5">
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill={note.isLiked ? "#FF412E" : "none"}
              stroke={note.isLiked ? "#FF412E" : "currentColor"}
              strokeWidth="2"
            >
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            {note.likesCount}
          </span>
        )}
        {note.stepCount > 0 && <span>풀이 {note.stepCount}단계</span>}
      </div>
    </button>
  );
};

export default WrongNoteCard;
