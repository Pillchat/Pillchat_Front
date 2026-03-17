"use client";

import { FC, useState } from "react";
import { fetchAPI } from "@/lib/functions";
import type { BookmarkListItem } from "@/types/questionbank";

interface BookmarkCardProps {
  item: BookmarkListItem;
  onToggle: (questionId: number) => void;
}

const BookmarkCard: FC<BookmarkCardProps> = ({ item, onToggle }) => {
  const [expanded, setExpanded] = useState(false);
  const [toggling, setToggling] = useState(false);

  const handleToggleBookmark = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (toggling) return;
    setToggling(true);
    try {
      await fetchAPI("/api/questionbank/bookmarks", "POST", {
        questionId: item.questionId,
      });
      onToggle(item.questionId);
    } catch {
      // 에러 무시
    } finally {
      setToggling(false);
    }
  };

  return (
    <div className="border-b">
      <button
        className="flex w-full items-start gap-3 px-6 py-4 text-left transition-colors active:bg-gray-50"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex-1 overflow-hidden">
          <div className="mb-1.5 flex items-center gap-2">
            {item.subject && (
              <span className="flex-shrink-0 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-muted-foreground">
                {item.subject}
              </span>
            )}
            <span
              className={`flex-shrink-0 rounded-full px-2 py-0.5 text-xs ${
                item.source === "AUTO"
                  ? "bg-orange-50 text-orange-600"
                  : "bg-blue-50 text-blue-600"
              }`}
            >
              {item.source === "AUTO" ? "자동" : "수동"}
            </span>
          </div>

          <p className="text-sm leading-relaxed text-foreground line-clamp-2">
            {item.content}
          </p>

          {item.choices && item.choices.length > 0 && !expanded && (
            <p className="mt-1 text-xs text-muted-foreground">
              {item.choices.length}개 선지
            </p>
          )}
        </div>

        {/* 북마크 해제 버튼 */}
        <button
          className="mt-1 flex-shrink-0"
          onClick={handleToggleBookmark}
          disabled={toggling}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="#FF412E"
            stroke="#FF412E"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
          </svg>
        </button>
      </button>

      {/* 펼침 영역: 선지 + 정답 + 해설 */}
      {expanded && (
        <div className="bg-gray-50 px-6 py-4">
          {item.choices && item.choices.length > 0 && (
            <div className="mb-3 flex flex-col gap-1">
              {item.choices.map((choice, i) => (
                <p
                  key={i}
                  className={`text-sm ${
                    choice === item.answer
                      ? "font-semibold text-brand"
                      : "text-foreground"
                  }`}
                >
                  {i + 1}. {choice}
                </p>
              ))}
            </div>
          )}

          <div className="rounded-lg bg-white p-3">
            <p className="text-sm font-medium text-brand">
              정답: {item.answer}
            </p>
            {item.explanation && (
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                {item.explanation}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default BookmarkCard;
