"use client";

import { FC, ReactNode } from "react";

interface EntryButtonProps {
  icon: ReactNode;
  title: string;
  subtitle: string;
  onClick?: () => void;
  compact?: boolean;
  endAccent?: boolean;
}

const EntryButton: FC<EntryButtonProps> = ({
  icon,
  title,
  subtitle,
  onClick,
  compact = false,
  endAccent = false,
}) => {
  const isDisabled = !onClick;

  return (
    <button
      className={`relative flex w-full items-center rounded-xl text-left transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 active:scale-[0.98] disabled:cursor-default disabled:opacity-60 ${compact ? "gap-3.5 py-3.5 tracking-[0.01em]" : "gap-3 py-4"}`}
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
      {endAccent && (
        <span
          aria-hidden="true"
          className="absolute -left-6 top-1/2 h-14 w-2 -translate-y-1/2 bg-primary/50"
        />
      )}
    </button>
  );
};

export default EntryButton;
