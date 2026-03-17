"use client";

import { FC } from "react";
import { cn } from "@/lib/utils";
import type { SubjectTopic } from "@/types/questionbank";

interface SubjectTopicModalProps {
  isOpen: boolean;
  subjectName: string;
  topics: SubjectTopic[];
  loading: boolean;
  onSelect: (topic: SubjectTopic) => void;
  onClose: () => void;
}

const SubjectTopicModal: FC<SubjectTopicModalProps> = ({
  isOpen,
  subjectName,
  topics,
  loading,
  onSelect,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      {/* 헤더 */}
      <div className="flex items-center border-b px-4 py-3">
        <button
          className="flex h-10 w-10 items-center justify-center"
          onClick={onClose}
        >
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
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <h2 className="flex-1 text-center text-lg font-bold">{subjectName}</h2>
        <div className="w-10" />
      </div>

      {/* 토픽 목록 */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-muted-foreground">토픽 불러오는 중...</p>
          </div>
        ) : topics.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-muted-foreground">등록된 토픽이 없습니다.</p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {topics.map((topic) => (
              <button
                key={topic.topicId}
                className={cn(
                  "rounded-full border border-gray-200 px-4 py-2 text-sm text-foreground transition-colors",
                  "active:border-brand active:bg-brandSecondary active:text-brand",
                )}
                onClick={() => onSelect(topic)}
              >
                {topic.name}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SubjectTopicModal;
