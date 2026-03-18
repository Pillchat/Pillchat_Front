"use client";

import { format } from "date-fns";
import { FC } from "react";

export const MaterialTitleSection: FC<{
  title: string;
  userName: string;
  subjectName: string;
  createdAt: string;
}> = ({ title, userName, subjectName, createdAt }) => {
  const formattedDate =
    createdAt && !Number.isNaN(new Date(createdAt).getTime())
      ? format(new Date(createdAt), "yyyy-MM-dd HH:mm:ss")
      : "";

  return (
    <div className="flex flex-col gap-1">
      <div className="text-left text-xl font-semibold">{title}</div>
      <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
        <span className="text-foreground">{userName}</span>
        {subjectName && <span>{subjectName}</span>}
        {formattedDate && <span>{formattedDate}</span>}
      </div>
    </div>
  );
};