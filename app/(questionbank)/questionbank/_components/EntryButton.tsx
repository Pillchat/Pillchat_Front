"use client";

import { FC, ReactNode } from "react";
import { ChevronRight } from "lucide-react";

interface EntryButtonProps {
  icon: ReactNode;
  title: string;
  subtitle: ReactNode;
  onClick?: () => void;
  compact?: boolean;
  framed?: boolean;
}

const EntryButton: FC<EntryButtonProps> = ({
  icon,
  title,
  subtitle,
  onClick,
  compact = false,
  framed = false,
}) => {
  const isDisabled = !onClick;

  return (
    <button
      className={`flex w-full items-center rounded-xl text-left transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 active:scale-[0.98] disabled:cursor-default disabled:opacity-60 ${framed ? "gap-3 border border-gray-200 p-3" : compact ? "gap-3.5 py-3.5 tracking-[0.01em]" : "gap-3 py-4"}`}
      onClick={onClick}
      disabled={isDisabled}
      aria-disabled={isDisabled}
      type="button"
    >
      <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center text-primary">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-base font-semibold text-foreground">{title}</p>
        <p
          className={`text-sm leading-5 text-muted-foreground ${compact ? "mt-1.5" : "mt-1"}`}
        >
          {subtitle}
        </p>
      </div>
      {framed && (
        <ChevronRight
          aria-hidden="true"
          className="h-4 w-4 shrink-0 text-muted-foreground"
          strokeWidth={1.5}
        />
      )}
    </button>
  );
};

export default EntryButton;
