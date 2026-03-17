"use client";

import { FC, ReactNode } from "react";

interface EntryButtonProps {
  icon: ReactNode;
  title: string;
  subtitle: string;
  onClick: () => void;
}

const EntryButton: FC<EntryButtonProps> = ({
  icon,
  title,
  subtitle,
  onClick,
}) => {
  return (
    <button
      className="flex w-full items-center gap-4 rounded-2xl border border-gray-100 bg-white px-5 py-5 text-left shadow-sm transition-shadow active:shadow-none"
      onClick={onClick}
    >
      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-brandSecondary">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-base font-semibold text-foreground">{title}</p>
        <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>
      </div>
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#999"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </button>
  );
};

export default EntryButton;
