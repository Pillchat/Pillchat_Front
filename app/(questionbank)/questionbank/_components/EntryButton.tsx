"use client";

import { FC, ReactNode } from "react";

interface EntryButtonProps {
  icon: ReactNode;
  title: string;
  subtitle: string;
  onClick?: () => void;
}

const EntryButton: FC<EntryButtonProps> = ({
  icon,
  title,
  subtitle,
  onClick,
}) => {
  const isDisabled = !onClick;

  return (
    <button
      className="flex w-full items-center gap-3 py-4 text-left transition-transform active:scale-[0.98] disabled:cursor-default disabled:opacity-60"
      onClick={onClick}
      disabled={isDisabled}
      aria-disabled={isDisabled}
      type="button"
    >
      <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg bg-accent text-primary-600">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-base font-semibold text-foreground">{title}</p>
        <p className="mt-1 text-sm leading-5 text-muted-foreground">
          {subtitle}
        </p>
      </div>
    </button>
  );
};

export default EntryButton;
