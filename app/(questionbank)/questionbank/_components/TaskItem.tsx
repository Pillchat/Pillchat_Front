"use client";

import { FC } from "react";
import type { MyTaskItem } from "@/types/questionbank";

interface TaskItemProps {
  task: MyTaskItem;
  onClick: () => void;
}

const TaskItem: FC<TaskItemProps> = ({ task, onClick }) => {
  const date = new Date(task.createdAt);
  const formattedDate = `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;

  return (
    <div
      className="flex cursor-pointer items-center justify-between border-b px-6 py-4 active:bg-gray-50"
      onClick={onClick}
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-base font-semibold text-foreground">
          {task.title}
        </p>
        <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
          <span>{task.subject}</span>
          <span className="flex items-center gap-1">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="2" y="3" width="20" height="18" rx="2" ry="2" />
              <line x1="8" y1="7" x2="8" y2="7" />
              <line x1="16" y1="7" x2="16" y2="7" />
              <line x1="8" y1="12" x2="8" y2="12" />
              <line x1="16" y1="12" x2="16" y2="12" />
              <line x1="8" y1="17" x2="8" y2="17" />
            </svg>
            {task.generatedCount}
          </span>
          <span>{formattedDate}</span>
        </div>
      </div>
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#9ca3af"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="flex-shrink-0"
      >
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </div>
  );
};

export default TaskItem;
