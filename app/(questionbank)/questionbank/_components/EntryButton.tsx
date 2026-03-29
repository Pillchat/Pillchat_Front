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
      className="flex h-full w-full items-start gap-4 rounded-2xl border border-gray-100 bg-white px-5 py-5 text-left shadow-sm transition-all active:shadow-none disabled:cursor-default disabled:bg-gray-50 disabled:opacity-70 md:min-h-[10.5rem] md:flex-col md:gap-5 md:px-6 md:py-6"
      onClick={onClick}
      disabled={isDisabled}
      aria-disabled={isDisabled}
      type="button"
    >
      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-brandSecondary md:h-14 md:w-14">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-base font-semibold leading-snug text-foreground md:text-lg">
          {title}
        </p>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          {subtitle}
        </p>
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
        className="mt-3 flex-shrink-0 md:mt-auto md:self-end"
      >
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </button>
  );
};

export default EntryButton;
